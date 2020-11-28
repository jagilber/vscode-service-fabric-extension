import { FSWatcher } from "fs";
import { runInThisContext } from "vm";
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
    tempFile: string = null
    writeEmitter = new vscode.EventEmitter<vscode.Uri>();
    requestCounter: number = 0;

    constructor() {
        //   this.initialize();
    }

    createTerminal(terminalName: string): boolean {
        if (vscode.window.terminals.find(x => x.name === terminalName)) {
            console.log(`found existing terminal ${terminalName}`);
            this.terminal = vscode.window.terminals.find(x => x.name === terminalName);
        }
        else {
            this.terminal = vscode.window.createTerminal(terminalName);
        }

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
            this.terminal.show();
        }

        if (this.terminal === null) {
            return false;
        }

        return true;
    }

    async disposeTerminal():Promise<unknown> {
        return await new Promise((resolve, reject) =>{
            if (this.terminal !== null) {
                console.log('disposing terminal');
                this.terminal.dispose();
            }

            if(powershellTerminal.tempDir !== null){
                console.log(`removing temp dir: ${powershellTerminal.tempDir}`);
                fs.rmdir(powershellTerminal.tempDir, {
                    maxRetries: 3,
                    recursive: true,
                    retryDelay: 1000
                });
                console.log(`removed temp dir: ${powershellTerminal.tempDir}`);
            }
            resolve(undefined);
        });
    }

    async initialize(terminalName: string):Promise<unknown> {
        return await new Promise((resolve, reject) => {

            if (powershellTerminal.tempDir === null) {
                fs.mkdtemp(path.join(os.tmpdir(), 'pst-'), (err, directory) => {
                    if (err) {
                        throw err;
                    }

                    console.log(directory);
                    powershellTerminal.tempDir = directory.replace(/\\/g, '/');

                    this.createTerminal(terminalName);
                    this.send(this.outFunctionGenerator(), false);

                    fs.watch(powershellTerminal.tempDir, (eventType, filename) => {
                        console.log(`event type is: ${eventType}`);
                        if (filename) {
                            console.log(`filename provided: ${filename}`);
                        } else {
                            console.log('filename not provided');
                        }
                        emitter.emit('change', filename);
                    });

                    resolve(undefined);
                });
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
                    [int]$depth = 1,\
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
                    $r = . $item;\
                    write-host ($r| fl * | out-string);\
                    $r | convertto-json -depth $depth | out-file "$fileName";\
                }\
                catch {\
                    $error | convertto-json -depth $depth | out-file "$fileName";\
                }\
            }';
    }

    async readJson(jsonFile: string): Promise<JSON> {
        return await new Promise((resolve, reject) => {
            fs.readFile(jsonFile, 'utf8', (err, jsonString) => {
                if (err) {
                    console.log("json read failed:", err);
                    reject();
                }
                console.log('json data:', jsonString);
                resolve(JSON.parse(jsonString));
            });
        });
    }

    async readText(textFile: string): Promise<string> {
        return await new Promise((resolve, reject) => {
            fs.readFile(textFile, 'utf8', (err, textString) => {
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

    show(): void {
        this.terminal.show();
    }

    async sendReceiveText(terminalCommand: string): Promise<string> {
        return await new Promise(async (resolve, reject) => {
            resolve(await this.readJson(await this.send(terminalCommand, true)));
        });
    }

    async send(terminalCommand: string, wait: boolean = true): Promise<string> {
        return await new Promise(async (resolve, reject) => {
            var fileName: string = powershellTerminal.tempDir + '/' + ++this.requestCounter + '.json';
            //terminalCommand += ' | convertto-json | out-file ' + fileName + '\r\n';
            if (wait) {
                //terminalCommand += ' | out-json("' + fileName + '")\r\n';
                //terminalCommand = 'out-json -item "'+ terminalCommand +'" -filename "' + fileName + '";\r\n';
                terminalCommand = '"' + terminalCommand + '" | out-json -counter ' + this.requestCounter + ';\r\n';
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
        var promise:Promise<string> = new Promise(async (resolve, reject) => {
            await this.send(terminalCommand, true);
            resolve(undefined);
        });
    }

    waitForObject(objectParam): boolean {
        while (objectParam === null) {
            console.log(objectParam === null);
            setTimeout(this.waitForObject, 1000, objectParam);
        }

        return true;
    }

    async waitForEvent<T>(emitter: NodeJS.EventEmitter, pendingFileName: string): Promise<unknown> {
        return await new Promise((resolve, reject) => {
            emitter.once('change', (fileName) => {
                console.log(`emitter: ${fileName}`);
                if (pendingFileName.endsWith('/' + fileName)) {
                    console.log(`emitter: ${pendingFileName}`);
                    resolve(pendingFileName);
                }
            });
            emitter.once('error', (event) => {
                console.error(`emitter: ${event}`);
                reject(event);
            });
        });
    }
}