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
class powershellTerminal {
    constructor(terminalName) {
        //  new Promise(() => {
        this.terminal = null;
        this.fileWatcher = null;
        //tempFile: string = './powershell-terminal-transcript.tmp';
        this.tempFile = vscode.workspace.rootPath.replace('\\\\', '/') + '/powershell-terminal-transcript.tmp';
        this.writeEmitter = new vscode.EventEmitter();
        this.fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.tmp'); //(this.tempFile);
        var listener = this.fileWatcher.onDidChange(function (uri) {
            console.log(uri);
            this.writeEmitter.fire(uri);
        });
        //this.fileWatcher.onDidChange = this.writeEmitter.event;
        this.createTerminal(terminalName);
        //  });
        // ((uri) =>{
        //     console.log('test');
        //     console.log('file changed: ' + uri);
        // });
    }
    send(terminalCommand) {
        return __awaiter(this, void 0, void 0, function* () {
            // return new Promise(() => {
            yield this.terminal.sendText(terminalCommand + '\r\n');
            //  });
        });
    }
    receive() {
        return __awaiter(this, void 0, void 0, function* () {
            //  return new Promise(() => {
            this.fileWatcher.onDidChange;
            yield console.log(this.writeEmitter.event);
            //  });
        });
    }
    createTerminal(terminalName) {
        this.terminal = vscode.window.createTerminal(terminalName);
        //this.terminal.processId;
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
            this.send('start-transcript ' + this.tempFile);
            this.receive();
        }
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
//# sourceMappingURL=powershell-terminal.js.map