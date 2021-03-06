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
    }
    addFileWatcher() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => {
                fs.watch(powershellTerminal.tempDir, (eventType, filename) => {
                    this.consoleLog(`event type is: ${eventType}`);
                    if (filename) {
                        this.consoleLog(`filename provided: ${filename}`);
                    }
                    else {
                        this.consoleLog('filename not provided');
                    }
                    emitter.emit(eventType, filename);
                });
                resolve(undefined);
            });
        });
    }
    consoleLog(data) {
        console.log(new Date().toUTCString() + ':' + data);
    }
    createTerminal(terminalName) {
        if (vscode.window.terminals.find(x => x.name === terminalName)) {
            this.consoleLog(`found existing terminal ${terminalName}`);
            this.terminal = vscode.window.terminals.find(x => x.name === terminalName);
        }
        else {
            this.terminal = vscode.window.createTerminal(terminalName);
            if (vars._isLinux || vars._isMacintosh) {
                exec('sfctl cluster select --endpoint', function (err, stdout, stderr) {
                    if (err) {
                        vscode.window.showErrorMessage("Could not connect to cluster.");
                        this.consoleLog(err);
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
    deleteJsonFile(jsonFile) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => {
                if (fs.existsSync(jsonFile)) {
                    this.consoleLog(`removing jsonFile: ${jsonFile}`);
                    fs.unlinkSync(jsonFile);
                    this.consoleLog(`removed jsonFile: ${jsonFile}`);
                }
                resolve(jsonFile);
            });
        });
    }
    disposeTerminal() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => {
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
        });
    }
    hide() {
        this.terminal.hide();
    }
    initialize(terminalName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (powershellTerminal.tempDir === null) {
                    fs.mkdtemp(path.join(os.tmpdir(), 'pst-'), (err, directory) => __awaiter(this, void 0, void 0, function* () {
                        if (err) {
                            throw err;
                        }
                        this.consoleLog(directory);
                        powershellTerminal.tempDir = directory.replace(/\\/g, '/');
                        this.createTerminal(terminalName);
                        yield this.send(`write-host "using: ${powershellTerminal.tempDir}"`, false);
                        yield this.addFileWatcher();
                        resolve(undefined);
                    }));
                }
                else {
                    this.createTerminal(terminalName);
                    yield this.addFileWatcher();
                    resolve(undefined);
                }
            }));
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
            return yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                yield fs.readFile(jsonFile, 'utf8', (err, jsonString) => {
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
            }));
        });
    }
    readText(textFile) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                yield fs.readFile(textFile, 'utf8', (err, textString) => {
                    if (err) {
                        this.consoleLog(`text read failed: ${err}`);
                        reject();
                    }
                    this.consoleLog(`text data: ${textString}`);
                    resolve(textString);
                });
            }));
        });
    }
    receive(outputFile) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                yield this.waitForEvent(emitter, outputFile);
                this.consoleLog('receive returning');
                resolve(outputFile);
            }));
        });
    }
    sendReceive(terminalCommand, checkForErrors = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var resultJson = yield this.readJson(yield this.send(terminalCommand, true));
                if (checkForErrors) {
                    for (var key in resultJson) {
                        this.consoleLog(`checking key: ${key}`);
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
                var fileName = powershellTerminal.tempDir + '/' + ++powershellTerminal.requestCounter + '.json';
                if (wait) {
                    terminalCommand = '"' + terminalCommand + '" | out-json -counter ' + powershellTerminal.requestCounter + ';\r\n';
                }
                else {
                    terminalCommand += ';\r\n';
                }
                this.consoleLog(terminalCommand);
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
    show() {
        this.terminal.show();
    }
    waitForEvent(emitter, pendingFileName) {
        return __awaiter(this, void 0, void 0, function* () {
            this.consoleLog(`waitForEvent waiting for: ${pendingFileName}`);
            var timer = null;
            return yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                emitter.on('rename', (fileName) => __awaiter(this, void 0, void 0, function* () {
                    this.consoleLog(`waitForEvent rename emitter: ${fileName}`);
                    if (pendingFileName.endsWith('/' + fileName)) {
                        // to handle null/no output as rename is always first event
                        if (timer !== null) {
                            this.consoleLog(`waitForEvent rename emitter. timer exists!: ${fileName}`);
                            return;
                        }
                        yield new Promise((res) => timer =
                            setTimeout(() => res(emitter.emit('change', fileName)), 1000));
                        this.consoleLog(`waitForEvent rename emitted: ${pendingFileName}`);
                        emitter.removeAllListeners();
                        resolve(pendingFileName);
                    }
                }));
                emitter.on('change', (fileName) => {
                    this.consoleLog(`waitForEvent change emitter: ${fileName}`);
                    if (pendingFileName.endsWith('/' + fileName)) {
                        this.consoleLog(`waitForEvent change emitted: ${pendingFileName}`);
                        emitter.removeAllListeners();
                        if (timer !== null) {
                            clearTimeout(timer);
                        }
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
            }));
        });
    }
}
exports.powershellTerminal = powershellTerminal;
powershellTerminal.tempDir = null;
powershellTerminal.requestCounter = 0;
//# sourceMappingURL=powershell-terminal.js.map