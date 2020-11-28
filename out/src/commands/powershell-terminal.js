"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.powershellTerminal = void 0;
const vscode = require("vscode");
const vars = require("./osdetector");
const exec = require('child_process').exec;
const fs = require("fs");
const path = require('path');
const os = require('os');
const eventEmitter = require('events');
const emitter = new eventEmitter();
class powershellTerminal {
    constructor() {
        this.terminal = null;
        this.fileWatcher = null;
        this.tempFile = null;
        this.writeEmitter = new vscode.EventEmitter();
        this.requestCounter = 0;
        //   this.initialize();
    }
    createTerminal(terminalName) {
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
    disposeTerminal() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => {
                if (this.terminal !== null) {
                    console.log('disposing terminal');
                    this.terminal.dispose();
                }
                if (powershellTerminal.tempDir !== null) {
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
        });
    }
    initialize(terminalName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => {
                if (powershellTerminal.tempDir === null) {
                    fs.mkdtemp(path.join(os.tmpdir(), 'pst-'), (err, directory) => {
                        if (err) {
                            throw err;
                        }
                        console.log(directory);
                        powershellTerminal.tempDir = directory.replace(/\\/g, '/');
                        this.createTerminal(terminalName);
                        this.send(this.outFunctionGenerator(), false);
                        this.send(`write-host "using: ${powershellTerminal.tempDir}"`, false);
                        fs.watch(powershellTerminal.tempDir, (eventType, filename) => {
                            console.log(`event type is: ${eventType}`);
                            if (filename) {
                                console.log(`filename provided: ${filename}`);
                            }
                            else {
                                console.log('filename not provided');
                            }
                            emitter.emit('change', filename);
                        });
                        resolve(undefined);
                    });
                }
            });
        });
    }
    outFunctionGenerator() {
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
    readJson(jsonFile, nullOk = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => {
                fs.readFile(jsonFile, 'utf8', (err, jsonString) => {
                    if (err) {
                        console.log("json read failed:", err);
                        reject();
                    }
                    console.log('json data:', jsonString);
                    if (jsonString.length < 2) {
                        console.log("json read failed: empty file", jsonString);
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
        });
    }
    readText(textFile) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => {
                fs.readFile(textFile, 'utf8', (err, textString) => {
                    if (err) {
                        console.log("text read failed:", err);
                        reject();
                    }
                    console.log('text data:', textString);
                    resolve(textString);
                });
            });
        });
    }
    receive(outputFile) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                yield this.waitForEvent(emitter, outputFile);
                console.log('receive returning');
                resolve(outputFile);
            }));
        });
    }
    show() {
        this.terminal.show();
    }
    sendReceive(terminalCommand, checkForErrors = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var resultJson = yield this.readJson(yield this.send(terminalCommand, true));
                if (checkForErrors) {
                    for (var key in resultJson) {
                        console.log(`checking key: ${key}`);
                        if (resultJson[key].hasOwnProperty('Exception')) {
                            reject(resultJson);
                        }
                    }
                }
                resolve(resultJson);
            }));
        });
    }
    sendReceiveText(terminalCommand, checkForErrors = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var resultText = yield this.readText(yield this.send(terminalCommand, true));
                if (checkForErrors) {
                    if (resultText.startsWith('Exception') || resultText.startsWith('Error')) {
                        reject(resultText);
                    }
                }
                resolve(resultText);
            }));
        });
    }
    send(terminalCommand, wait = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var fileName = powershellTerminal.tempDir + '/' + ++this.requestCounter + '.json';
                if (wait) {
                    terminalCommand = '"' + terminalCommand + '" | out-json -counter ' + this.requestCounter + ';\r\n';
                }
                else {
                    terminalCommand += ';\r\n';
                }
                console.log(terminalCommand);
                this.terminal.sendText(terminalCommand);
                if (wait) {
                    yield this.waitForEvent(emitter, fileName);
                }
                resolve(fileName);
            }));
        });
    }
    sendText(terminalCommand) {
        var promise = new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            yield this.send(terminalCommand, true);
            resolve(undefined);
        }));
    }
    // waitForObject(objectParam): boolean {
    //     while (objectParam === null) {
    //         console.log(objectParam === null);
    //         setTimeout(this.waitForObject, 1000, objectParam);
    //     }
    //     return true;
    // }
    waitForEvent(emitter, pendingFileName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => {
                emitter.once('change', (fileName) => {
                    console.log(`waitforevent emitter: ${fileName}`);
                    if (pendingFileName.endsWith('/' + fileName)) {
                        console.log(`emitter: ${pendingFileName}`);
                        resolve(pendingFileName);
                    }
                });
                emitter.once('error', (event) => {
                    console.error(`waitforevent error emitter: ${event}`);
                    reject(event);
                });
            });
        });
    }
}
exports.powershellTerminal = powershellTerminal;
powershellTerminal.tempDir = null;
//# sourceMappingURL=powershell-terminal.js.map