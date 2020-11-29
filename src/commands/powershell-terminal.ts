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
    fileWatcher: vscode.FileSystemWatcher = null;
    static tempDir: string = null;
    tempFile: string = null;
    writeEmitter = new vscode.EventEmitter<vscode.Uri>();
    static requestCounter: number = 0;

    constructor() {
    }

    async addFileWatcher(): Promise<undefined> {
        return await new Promise((resolve, reject) => {
            fs.watch(powershellTerminal.tempDir, (eventType, filename) => {
                console.log(`event type is: ${eventType}`);
                if (filename) {
                    console.log(`filename provided: ${filename}`);
                } else {
                    console.log('filename not provided');
                }
                emitter.emit(eventType, filename);
            });
            resolve(undefined);
        });
    }

    createTerminal(terminalName: string): boolean {
        if (vscode.window.terminals.find(x => x.name === terminalName)) {
            console.log(`found existing terminal ${terminalName}`);
            this.terminal = vscode.window.terminals.find(x => x.name === terminalName);
        }
        else {
            this.terminal = vscode.window.createTerminal(terminalName);

            if (vars._isLinux || vars._isMacintosh) {
                exec('sfctl cluster select --endpoint', function (err, stdout, stderr) {
                    if (err) {
                        vscode.window.showErrorMessage("Could not connect to cluster.");
                        console.log(err);
                        return;
                    }
                });
            }
            else if (vars._isWindows) {
                this.send(this.outFunctionGenerator(), false);
                this.send('$PSModuleAutoLoadingPreference = 2', false);
                this.show();
            }
        }
        return this.terminal === null;
    }

    async deleteJsonFile(jsonFile: string): Promise<unknown> {
        return await new Promise((resolve, reject) => {
            if (fs.existsSync(jsonFile)) {
                console.log(`removing jsonFile: ${jsonFile}`);
                fs.unlinkSync(jsonFile);
                console.log(`removed jsonFile: ${jsonFile}`);
            }
            resolve(jsonFile);
        });
    }

    async disposeTerminal(): Promise<unknown> {
        return await new Promise((resolve, reject) => {
            if (this.terminal !== null) {
                console.log('disposing terminal');
                this.terminal.dispose();
            }

            if (powershellTerminal.tempDir !== null) {
                console.log(`removing temp dir: ${powershellTerminal.tempDir}`);
                fs.rmdirSync(powershellTerminal.tempDir, {
                    maxRetries: 3,
                    recursive: true,
                    retryDelay: 1000
                });
                console.log(`removed temp dir: ${powershellTerminal.tempDir}`);
            }
            resolve(undefined);
        });
    }

    hide(): void {
        this.terminal.hide();
    }

    async initialize(terminalName: string): Promise<unknown> {
        return await new Promise(async (resolve, reject) => {
            if (powershellTerminal.tempDir === null) {
                fs.mkdtemp(path.join(os.tmpdir(), 'pst-'), async (err, directory) => {
                    if (err) {
                        throw err;
                    }

                    console.log(directory);
                    powershellTerminal.tempDir = directory.replace(/\\/g, '/');

                    this.createTerminal(terminalName);
                    await this.send(`write-host "using: ${powershellTerminal.tempDir}"`, false);
                    await this.addFileWatcher();
                    resolve(undefined);
                });
            }
            else {
                this.createTerminal(terminalName);
                await this.addFileWatcher();
                resolve(undefined);
            }
        });
    }

    outFunctionGenerator(): string {
        return '$global:requestCounter = 0;\
            function out-json{\
                [CmdletBinding()]\
                Param(\
                    [Parameter(ValueFromPipeline)]\
                    [string]$item,\
                    [string]$fileDir = "' + powershellTerminal.tempDir + '",\
                    [int]$depth = 2,\
                    [int]$counter = 0\
                )\
                if($counter -eq 0){\
                    $counter = ++$global:requestCounter;\
                }\
                else{\
                    $global:requestCounter = $counter;\
                }\
                $fileName = $fileDir + "\\" + $counter + ".json";\
                $errorActionPreference = "continue";\
                write-host "$item";\
                try {\
                    $r = iex $item;\
                    write-host ($r | format-list * | out-string);\
                    $r | convertto-json -depth $depth -warningaction silentlycontinue | out-file "$fileName";\
                }\
                catch {\
                    write-error ($error | format-list * | out-string);\
                    $error | convertto-json -depth $depth -warningaction silentlycontinue | out-file "$fileName";\
                }\
            }\
            cls';
    }

    async readJson(jsonFile: string, nullOk: boolean = true): Promise<JSON> {
        return await new Promise(async (resolve, reject) => {
            await fs.readFile(jsonFile, 'utf8', (err, jsonString: string) => {
                if (err) {
                    console.log("json read failed:", err);
                    reject();
                }
                console.log(`json data:\r\n${jsonString}`);
                if (jsonString.length < 2) {
                    console.log(`json read failed: empty file: ${jsonString}`);
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
                    console.log("text read failed:", err);
                    reject();
                }
                console.log('text data:', textString);
                resolve(textString);
            });
        });
    }

    async receive(outputFile: string): Promise<string> {
        return await new Promise(async (resolve, reject) => {
            await this.waitForEvent(emitter, outputFile);
            console.log('receive returning');
            resolve(outputFile);
        });
    }

    async sendReceive(terminalCommand: string, checkForErrors: boolean = true): Promise<JSON> {
        return await new Promise(async (resolve, reject) => {
            var resultJson: JSON = await this.readJson(await this.send(terminalCommand, true));
            if (checkForErrors) {
                for (var key in resultJson) {
                    console.log(`checking key: ${key}`);
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
                if (resultText.startsWith('Exception') || resultText.startsWith('Error')) {
                    reject(resultText);
                }
            }
            resolve(resultText);
        });
    }

    async send(terminalCommand: string, wait: boolean = true): Promise<string> {
        return await new Promise(async (resolve, reject) => {
            var fileName: string = powershellTerminal.tempDir + '/' + ++powershellTerminal.requestCounter + '.json';

            if (wait) {
                terminalCommand = '"' + terminalCommand + '" | out-json -counter ' + powershellTerminal.requestCounter + ';\r\n';
            }
            else {
                terminalCommand += ';\r\n';
            }

            console.log(terminalCommand);
            this.terminal.sendText(terminalCommand);

            if (wait) {
                await this.waitForEvent(emitter, fileName);
            }

            resolve(fileName);
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

    async waitForEvent<T>(emitter: NodeJS.EventEmitter, pendingFileName: string): Promise<unknown> {
        console.log(`waitForEvent waiting for: ${pendingFileName}`);
        return await new Promise(async (resolve, reject) => {
            emitter.once('rename', async (fileName) => {
                console.log(`waitForEvent rename emitter: ${fileName}`);
                if (pendingFileName.endsWith('/' + fileName)) {
                    let timer;
                    var timeout: Promise<boolean> = new Promise<boolean>((res) => timer = setTimeout(() => res(emitter.emit('change', fileName)), 1000));
                    await Promise.race([await timeout, async () => {
                        emitter.once('change', (fileName) => {
                            console.log(`waitForEvent change emitter2: ${fileName}`);
                            if (pendingFileName.endsWith('/' + fileName)) {
                                console.log(`waitForEvent change emitted2: ${pendingFileName}`);
                                //emitter.removeAllListeners();
                                resolve(pendingFileName);
                            }
                        });
                    }]).finally(() => clearTimeout(timer));

                    console.log(`waitForEvent rename emitted: ${pendingFileName}`);
                    emitter.removeAllListeners();
                    resolve(pendingFileName);
                }
            });
            emitter.once('change', (fileName) => {
                console.log(`waitForEvent change emitter: ${fileName}`);
                if (pendingFileName.endsWith('/' + fileName)) {
                    console.log(`waitForEvent change emitted: ${pendingFileName}`);
                    //emitter.removeAllListeners();
                    resolve(pendingFileName);
                }
            });
            emitter.once('error', (fileName) => {
                if (pendingFileName.endsWith('/' + fileName)) {
                    console.error(`waitForEvent error emitter: ${fileName}`);
                    //emitter.removeAllListeners();
                    reject(fileName);
                }
            });
        });
    }
    async waitForEventBad<T>(emitter: NodeJS.EventEmitter, pendingFileName: string): Promise<unknown> {
        console.log(`waitForEvent waiting for: ${pendingFileName}`);
        return await new Promise(async (resolve, reject) => {
            emitter.on('rename', async (fileName) => {
                console.log(`waitForEvent rename emitter: ${fileName}`);
                if (pendingFileName.endsWith('/' + fileName)) {
                    let timer;
                    var timeout: Promise<boolean> = new Promise<boolean>((res) => timer = setTimeout(() => res(emitter.emit('change', fileName)), 10000));
                    await Promise.race([await timeout, async () => {
                        emitter.on('change', (fileName) => {
                            console.log(`waitForEvent change emitter2: ${fileName}`);
                            if (pendingFileName.endsWith('/' + fileName)) {
                                console.log(`waitForEvent change emitted2: ${pendingFileName}`);
                                emitter.removeAllListeners();
                                resolve(pendingFileName);
                            }
                        });
                    }]).finally(() => clearTimeout(timer));

                    console.log(`waitForEvent rename emitted: ${pendingFileName}`);
                    emitter.removeAllListeners();
                    resolve(pendingFileName);
                }
            });

            // emitter.on('change', (fileName) => {
            //     console.log(`waitForEvent change emitter: ${fileName}`);
            //     if (pendingFileName.endsWith('/' + fileName)) {
            //         console.log(`waitForEvent change emitted: ${pendingFileName}`);
            //         emitter.removeAllListeners();
            //         resolve(pendingFileName);
            //     }
            // });
            emitter.on('error', (fileName) => {
                if (pendingFileName.endsWith('/' + fileName)) {
                    console.error(`waitForEvent error emitter: ${fileName}`);
                    emitter.removeAllListeners();
                    reject(fileName);
                }
            });
        });
    }
}