import * as vscode from "vscode";
import * as vars from './osdetector';
const exec = require('child_process').exec;

export class powershellTerminal{

terminal: vscode.Terminal = null;
fileWatcher: vscode.FileSystemWatcher = null;
tempFile: string = './powershell-terminal-transcript.tmp'

constructor(terminalName: string){
    this.terminal = vscode.window.createTerminal(terminalName);
    this.fileWatcher = vscode.workspace.createFileSystemWatcher(this.tempFile);
}

async send(terminalCommand: string){
    await this.terminal.sendText(terminalCommand + '\r\n');
}

async receive(){
    await this.fileWatcher.onDidChange((uri) =>{
        console.log('file changed: ' + uri);
    });
}

async createTerminal(terminalName: string) {

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
        this.send('start-transcript '+ this.tempFile);
    }
}

async disposeTerminal(){
    if(this.terminal !== null){
        await this.send("stop-transcript");
    }
}

}