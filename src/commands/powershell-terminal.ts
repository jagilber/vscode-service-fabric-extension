import { time } from "console";
import { resolve } from "dns";
import * as vars from './osdetector';
import * as vscode from "vscode";
const eventEmitter = require('events');
const emitter = new eventEmitter();
const exec = require('child_process').exec;
const fs = require("fs");
const os = require('os');
const path = require('path');

export class powershellTerminal {
    static fileWatcher: vscode.FileSystemWatcher = null;
    static moduleList: string[] = null;
    static requestCounter: number = 1;
    static tempDir: string = null;
    static timeout: NodeJS.Timeout = null;
    static waitResult: boolean = false;
    tempFile: string = null;
    terminal: vscode.Terminal = null;
    writeEmitter = new vscode.EventEmitter<vscode.Uri>();

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
                    if (!await this.verifyTerminal()) {
                        if (!await this.verifyTerminal('pwsh.exe')) {
                            if (!await this.verifyTerminal('powershell.exe')) {
                                reject(false);
                            }
                        }
                    }
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
                    $result | convertto-json -depth $depth -warningaction silentlycontinue | out-file -encoding utf8 -append "$fileName";\
                }catch [Exception]{\
                    $_.Exception | out-file -append "$fileName";\
                    $error | fl * | out-string | out-file -append "$fileName";\
                    $error.clear();\
                }\
            }\
            cls';
    }

    async readJson(jsonFile: string, nullOk: boolean = true): Promise<JSON> {
        if (!jsonFile && nullOk) {
            return Promise.resolve(null);
        }
        return await new Promise(async (resolve, reject) => {
            await fs.readFile(jsonFile, 'utf8', (err, jsonString: string) => {
                jsonString = jsonString.trim();
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
        if (!textFile) {
            return Promise.resolve(null);
        }
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

    async send(terminalCommand: string, wait: boolean = true): Promise<string> {
        var fileName: string = powershellTerminal.tempDir + '/' + ++powershellTerminal.requestCounter + '.json';
        var promise: string = await new Promise(async (resolve, reject) => {
            if (wait) {
                terminalCommand = `{${terminalCommand}} | out-json -counter ${powershellTerminal.requestCounter}\r\n`;
            }
            else {
                terminalCommand += '\r\n';
            }

            this.consoleLog(`sending text to real console ${fileName}`);
            this.consoleLog(terminalCommand);
            this.terminal.sendText(terminalCommand);

            if (wait) {
                if (!await this.waitForEvent(emitter, fileName)) {
                    resolve(null);
                }
            }
            resolve(fileName);
        });
        return promise;
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
                if (resultText && resultText.trimStart().startsWith('Exception') || resultText.trimStart().startsWith('ErrorRecord')) {
                    console.error(resultText);
                    reject(`reject: error in record: ${resultText}`);
                }
            }
            resolve(resultText);
        });
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

    async sleep(timeoutMs: number): Promise<boolean> {
        return await new Promise((resolve, reject) => {
            powershellTerminal.timeout = setTimeout(() => {
                console.log(`sleep resolving ${new Date()}`);
                resolve(false);
                return false;
            }, timeoutMs);
            //setTimeout(resolve, timeoutMs);
        });
    }

    async verifyTerminal(cmd: string = null): Promise<boolean> {
        var promise: Promise<boolean> = new Promise(async (resolve, reject) => {
            try {
                if (cmd) {
                    await this.send(cmd, false);
                    await this.sleep(5000);
                }
                var pendingFileName: string = `${powershellTerminal.tempDir}/0.json`;
                await this.send(`[environment]::GetEnvironmentVariables() >>${pendingFileName}`, false);

                if (!await this.waitForEvent(emitter, pendingFileName)) {
                    return resolve(false);
                }

                await this.send(this.outFunctionGenerator(), false);
                var results: JSON = await this.sendReceive('$psversiontable');

                if (results === null || results['PSVersion'] === null) {
                    this.send('write-host "error: not a powershell console"', false);
                    return resolve(false);
                }

                await this.send('$PSModuleAutoLoadingPreference = 2', false);
                console.log(results);

                powershellTerminal.moduleList.forEach(async (module) => {
                    await this.send(`import-module ${module}`);
                });
                resolve(true);
            }
            catch (Exception) {
                console.error(Exception);
                resolve(false);
            }
        });

        promise.catch((error) => {
            console.error(error);
            return Promise.resolve(false);
        });
        return await promise;
    }

    async waitForEvent<T>(emitter: NodeJS.EventEmitter, pendingFileName: string, timeoutMs: number = 10000): Promise<string> {
        this.consoleLog(`waitForEvent waiting for: ${pendingFileName}`);
        if (!pendingFileName) {
            return Promise.resolve(null);
        }
        var timer: NodeJS.Timeout = null;

        var onRenameListener = async function (this, fileName): Promise<boolean> {
            this.consoleLog(`waitForEvent rename emitter: ${fileName}`);
            this.pendingFileName = pendingFileName;
            this.timer = timer;

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

        var onChangeListener = function (this, fileName): boolean {
            this.consoleLog(`waitForEvent change emitter: ${fileName}`);
            this.pendingFileName = pendingFileName;
            this.timer = timer;

            if (pendingFileName.endsWith('/' + fileName)) {
                this.consoleLog(`waitForEvent change emitted: ${pendingFileName}`);
                if (timer !== null) {
                    clearTimeout(timer);
                }
                return true;
            }
            return false;
        };

        var promise: Promise<string> = new Promise(async (resolve, reject) => {
            emitter.once('rename', async (fileName) => {
                if (await onRenameListener.call(this, fileName)) {
                    resolve(pendingFileName);
                }
            });

            emitter.once('change', (fileName) => {
                if (onChangeListener.call(this, fileName)) {
                    resolve(pendingFileName);
                }
            });

            emitter.once('error', (fileName) => {
                if (pendingFileName.endsWith('/' + fileName)) {
                    console.error(`waitForEvent error emitter: ${fileName}`);
                    if (timer !== null) {
                        clearTimeout(timer);
                    }
                    reject(null);
                }
            });
        });

        var start: Date = new Date();
        this.consoleLog(`starting race:${start}`);
        var result: boolean | string = await Promise.race([this.sleep(timeoutMs), promise]);

        var now: Date = new Date();
        this.consoleLog(`finished race:${now}`);

        if (!result) {
            console.error(`resolve(false) promise race (timedout):${now} ${pendingFileName}`);
            return Promise.resolve(null);
        }

        clearTimeout(powershellTerminal.timeout);
        //emitter.removeAllListeners();
        //emitter.off('rename', onRenameListener);
        //emitter.off('change', onChangeListener);
        //emitter.removeListener('change', onChangeListener);
        //emitter.removeListener('rename', onRenameListener);
        this.consoleLog(`listener count: ${emitter.listenerCount('change')}`);
        return promise;
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