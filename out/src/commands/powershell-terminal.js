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
                    [int]$depth = 1,\
                    [int]$counter = 0\
                )\
                if($counter -eq 0){\
                    $counter = ++$global:requestCounter;\
                }\
                $fileName = $fileDir + "\\" + $counter + ".json";\
                $errorActionPreference = "continue";\
                write-host "$item";\
                $r = . $item;\
                write-host ($r| fl * | out-string);\
                $r | convertto-json -depth $depth | out-file "$fileName";\
            }';
    }
    waitForEvent(emitter, pendingFileName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => {
                emitter.once('change', (fileName) => {
                    //console.log(emitter);
                    if (pendingFileName.endsWith(fileName)) {
                        console.log(pendingFileName);
                        resolve(pendingFileName);
                    }
                });
                emitter.once('error', (event) => {
                    console.error(event);
                    reject(event);
                });
            });
        });
    }
    send(terminalCommand, wait = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var fileName = powershellTerminal.tempDir + '/' + ++this.requestCounter + '.json';
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
                    yield this.waitForEvent(emitter, fileName);
                }
                resolve(fileName);
            }));
        });
    }
    readJson(jsonFile) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => {
                fs.readFile(jsonFile, 'utf8', (err, jsonString) => {
                    if (err) {
                        console.log("File read failed:", err);
                        reject();
                    }
                    console.log('File data:', jsonString);
                    resolve(jsonString);
                });
            });
        });
    }
    receive(jsonFile) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                yield this.waitForEvent(emitter, jsonFile);
                console.log('receive returning');
                resolve(jsonFile);
            }));
            //  });
        });
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
            //   this.readJson(this.send('start-transcript ' + this.tempFile));
        }
        if (this.terminal === null) {
            return false;
        }
        return true;
    }
    waitForObject(objectParam) {
        while (objectParam === null) {
            console.log(objectParam === null);
            setTimeout(this.waitForObject, 1000, objectParam);
        }
        return true;
    }
    disposeTerminal() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.terminal !== null) {
                yield this.send("stop-transcript");
            }
        });
    }
}
exports.powershellTerminal = powershellTerminal;
powershellTerminal.tempDir = null;
//# sourceMappingURL=powershell-terminal.js.map