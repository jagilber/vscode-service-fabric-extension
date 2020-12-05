import * as vscode from "vscode";
import * as vars from './osdetector';
const exec = require('child_process').exec;
const fs = require("fs");
const path = require('path');
const os = require('os');
const eventEmitter = require('events');
const emitter = new eventEmitter();

export class powershellTerminal {
    terminal: vscode.Terminal = null;
    static fileWatcher: vscode.FileSystemWatcher = null;
    static tempDir: string = null;
    tempFile: string = null;
    writeEmitter = new vscode.EventEmitter<vscode.Uri>();
    static requestCounter: number = 0;
    static moduleList: string[] = null;
    static waitResult: boolean = false;

    constructor(moduleList: string[] = null) {
        powershellTerminal.moduleList = moduleList;
    }

    private async addFileWatcher(directory: string): Promise<boolean> {
        return await new Promise((resolve, reject) => {
            if (powershellTerminal.fileWatcher === null) {
                try {
                    powershellTerminal.fileWatcher = fs.watch(directory, (eventType, filename) => {
                        this.consoleLog(`event type is: ${eventType}`);
                        if (filename) {
                            this.consoleLog(`filename provided: ${filename}`);
                        } else {
                            this.consoleLog('filename not provided');
                        }
                        emitter.emit(eventType, filename);
                    });
                    resolve(true);
                }
                catch {
                    powershellTerminal.fileWatcher = null;
                    reject(false);
                }
            }
            else {
                resolve(true);
            }

        });
    }

    private consoleLog(data: string) {
        console.log(new Date().toUTCString() + ':' + data);
    }

    private async createTerminal(terminalName: string): Promise<boolean> {
        return await new Promise(async (resolve, reject) => {
            if (vscode.window.terminals.find(x => x.name === terminalName)) {
                this.consoleLog(`found existing terminal ${terminalName}`);
                this.terminal = vscode.window.terminals.find(x => x.name === terminalName);
                resolve(true);
            }
            else {
                this.terminal = vscode.window.createTerminal(terminalName);

                if (vars._isLinux || vars._isMacintosh) {
                    exec('sfctl cluster select --endpoint', function (err, stdout, stderr) {
                        if (err) {
                            vscode.window.showErrorMessage("Could not connect to cluster.");
                            this.consoleLog(err);
                            reject(false);
                        }

                        resolve(true);
                    });
                }
                else if (vars._isWindows) {
                    this.show();
                    await this.send(this.outFunctionGenerator(), false);
                    var results: JSON = await this.sendReceive('$psversiontable');

                    if (results['PSVersion'] === null) {
                        await this.sendReceiveText('pwsh');
                        await this.send(this.outFunctionGenerator(), false);
                        results = await this.sendReceive('$psversiontable');
                        
                        if (results['PSVersion'] === null) {
                            this.send('error: not a powershell console', false);
                            reject(false);
                        }
                    }

                    await this.send('$PSModuleAutoLoadingPreference = 2', false);
                    console.log(results);

                    powershellTerminal.moduleList.forEach(async (module) => {
                        await this.send(`import-module ${module}`);
                    });

                    resolve(true);
                }
            }
        });
    }

    async deleteJsonFile(jsonFile: string): Promise<unknown> {
        return await new Promise((resolve, reject) => {
            if (fs.existsSync(jsonFile)) {
                this.consoleLog(`removing jsonFile: ${jsonFile}`);
                fs.unlinkSync(jsonFile);
                this.consoleLog(`removed jsonFile: ${jsonFile}`);
            }
            resolve(jsonFile);
        });
    }

    async disposeTerminal(): Promise<unknown> {
        return await new Promise((resolve, reject) => {
            if (this.terminal !== null) {
                this.consoleLog('disposing terminal');
                this.terminal.dispose();
            }

            if (powershellTerminal.tempDir !== null) {
                this.consoleLog(`removing temp dir: ${powershellTerminal.tempDir}`);
                fs.rmdirSync(powershellTerminal.tempDir, {
                    maxRetries: 3,
                    recursive: true,
                    retryDelay: 1000
                });
                this.consoleLog(`removed temp dir: ${powershellTerminal.tempDir}`);
            }
            resolve(undefined);
        });
    }

    hide(): void {
        this.terminal.hide();
    }

    async initialize(terminalName: string): Promise<any> {
        return await new Promise(async (resolve, reject) => {
            if (powershellTerminal.tempDir === null) {
                fs.mkdtemp(path.join(os.tmpdir(), 'pst-'), async (err, directory) => {
                    if (err) {
                        reject(err);
                    }

                    powershellTerminal.tempDir = directory.replace(/\\/g, '/');
                    await this.addFileWatcher(powershellTerminal.tempDir);
                    this.consoleLog(directory);

                    await this.createTerminal(terminalName);
                    await this.send(`write-host "using: ${powershellTerminal.tempDir}"`, false);
                    resolve(powershellTerminal.tempDir);
                });
            }
            else {
                await this.addFileWatcher(powershellTerminal.tempDir);
                await this.createTerminal(terminalName);
                resolve(powershellTerminal.tempDir);
            }
        });
    }

    private outFunctionGenerator(): string {
        return '$global:requestCounter = 0;\
            function out-json{\
                [CmdletBinding()]\
                Param(\
                    [Parameter(ValueFromPipeline)]\
                    [scriptBlock]$scriptBlock,\
                    [int]$counter = 0,\
                    [string]$fileDir = "' + powershellTerminal.tempDir + '",\
                    [int]$depth = 2\
                )\
                if($counter -eq 0){\
                    $counter = ++$global:requestCounter;\
                }\
                else{\
                    $global:requestCounter = $counter;\
                }\
                $fileName = $fileDir + "\\" + $counter + ".json";\
                $errorActionPreference = "continue";\
                try{\
                    write-host $scriptBlock -foreground cyan;\
                    $result = invoke-command -scriptblock $scriptblock;\
                    $result;\
                    $result | convertto-json -depth $depth -warningaction silentlycontinue | out-file -append "$fileName";\
                }catch [Exception]{\
                    $_.Exception | out-file -append "$fileName";\
                    $error | fl * | out-string | out-file -append "$fileName";\
                    $error.clear();\
                }\
            }\
            cls';
    }

    async readJson(jsonFile: string, nullOk: boolean = true): Promise<JSON> {
        return await new Promise(async (resolve, reject) => {
            await fs.readFile(jsonFile, 'utf8', (err, jsonString: string) => {
                if (err) {
                    this.consoleLog(`json read failed: ${err}`);
                    reject();
                }
                this.consoleLog(`json data:\r\n${jsonString}`);
                if (jsonString.length < 2) {
                    this.consoleLog(`json read failed: empty file: ${jsonString}`);
                    if (nullOk) {
                        resolve(JSON);
                    }
                    else {
                        reject(jsonString);
                    }
                }
                resolve(JSON.parse(jsonString));
            });
        });
    }

    async readText(textFile: string): Promise<string> {
        return await new Promise(async (resolve, reject) => {
            await fs.readFile(textFile, 'utf8', (err, textString) => {
                if (err) {
                    this.consoleLog(`text read failed: ${err}`);
                    reject();
                }
                this.consoleLog(`text data: ${textString}`);
                resolve(textString);
            });
        });
    }

    async receive(outputFile: string): Promise<string> {
        return await new Promise(async (resolve, reject) => {
            await this.waitForEvent(emitter, outputFile);
            this.consoleLog('receive returning');
            resolve(outputFile);
        });
    }

    async sendReceive(terminalCommand: string, checkForErrors: boolean = true): Promise<JSON> {
        return await new Promise(async (resolve, reject) => {
            var resultJson: JSON = await this.readJson(await this.send(terminalCommand, true));
            if (checkForErrors) {
                for (var key in resultJson) {
                    this.consoleLog(`checking key: ${key}`);
                    if (resultJson[key].hasOwnProperty('Exception')) {
                        reject(resultJson);
                    }
                }
            }
            resolve(resultJson);
        });
    }

    async sendReceiveText(terminalCommand: string, checkForErrors: boolean = true): Promise<string> {
        return await new Promise(async (resolve, reject) => {
            var resultText: string = await this.readText(await this.send(terminalCommand, true));
            if (checkForErrors) {
                if (resultText.trimStart().startsWith('Exception') || resultText.trimStart().startsWith('ErrorRecord')) {
                    console.error(resultText);
                    reject(`reject: error in record: ${resultText}`);
                }
            }
            resolve(resultText);
        });
    }

    async send(terminalCommand: string, wait: boolean = true): Promise<string> {
        var fileName: string = powershellTerminal.tempDir + '/' + ++powershellTerminal.requestCounter + '.json';
        var promise: string = await new Promise(async (resolve, reject) => {
            if (wait) {
                //terminalCommand = `try{${terminalCommand} | out-json -counter ${powershellTerminal.requestCounter};}\
                //    catch{$error | out-json -counter ${powershellTerminal.requestCounter};}\r\n`;
                terminalCommand = `{${terminalCommand}} | out-json -counter ${powershellTerminal.requestCounter};\r\n`;
            }
            else {
                terminalCommand += ';\r\n';
            }

            this.consoleLog(terminalCommand);
            this.terminal.sendText(terminalCommand);

            if (wait) {
                await this.waitForEvent(emitter, fileName);
            }

            resolve(fileName);
        });

        return promise;
    }

    sendText(terminalCommand: string): void {
        var promise: Promise<string> = new Promise(async (resolve, reject) => {
            await this.send(terminalCommand, true);
            resolve(undefined);
        });
    }

    show(): void {
        this.terminal.show();
    }

    async sleep(ms: number) {
        return new Promise(function (resolve, reject) {
            setTimeout(function () { resolve(undefined); }, ms);
        });
    }

    async waitForEvent<T>(emitter: NodeJS.EventEmitter, pendingFileName: string): Promise<unknown> {
        this.consoleLog(`waitForEvent waiting for: ${pendingFileName}`);
        var timer: NodeJS.Timeout = null;

        var onRenameListener = async function (this, fileName, pendingFileName): Promise<boolean> {
            this.consoleLog(`waitForEvent rename emitter: ${fileName}`);
            if (pendingFileName.endsWith('/' + fileName)) {
                // to handle null/no output as rename is always first event
                if (timer !== null) {
                    this.consoleLog(`waitForEvent rename emitter. rename event already fired: ${fileName}`);
                    return;
                }
                await new Promise<boolean>((res) => timer =
                    setTimeout(() =>
                        res(emitter.emit('change', fileName)), 1000));
                this.consoleLog(`waitForEvent rename emitted: ${pendingFileName}`);
                return true;
            }

            return false;
        };

        var onChangeListener = function (this, fileName, pendingFileName): boolean {
            this.consoleLog(`waitForEvent change emitter: ${fileName}`);
            if (pendingFileName.endsWith('/' + fileName)) {
                this.consoleLog(`waitForEvent change emitted: ${pendingFileName}`);
                if (timer !== null) {
                    clearTimeout(timer);
                }
                return true;
            }
            return false;
        };

        return await new Promise(async (resolve, reject) => {
            emitter.on('rename', async (fileName) => {
                if (await onRenameListener.call(this, fileName, pendingFileName)) {
                    emitter.off('rename', onRenameListener);
                    resolve(pendingFileName);
                }
            });

            emitter.on('change', (fileName) => {
                if (onChangeListener.call(this, fileName, pendingFileName)) {
                    emitter.off('change', onChangeListener);
                    resolve(pendingFileName);
                }
            });

            emitter.on('error', (fileName) => {
                if (pendingFileName.endsWith('/' + fileName)) {
                    console.error(`waitForEvent error emitter: ${fileName}`);
                    emitter.removeAllListeners();
                    if (timer !== null) {
                        clearTimeout(timer);
                    }
                    reject(fileName);
                }
            });
        });
    }

    async waitForResult(): Promise<boolean> {
        while (powershellTerminal.waitResult === false) {
            console.log('waitForResult');
            await this.sleep(1000);
            //setTimeout(this.waitForResult, 1000);
            //setTimeout(null, 1000);
            //return this.waitForResult();
        }
        powershellTerminal.waitResult = false;
        return true;
    }

}