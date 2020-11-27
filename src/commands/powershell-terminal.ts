import * as vscode from "vscode";
import * as vars from './osdetector';
const exec = require('child_process').exec;

export class powershellTerminal {

    terminal: vscode.Terminal = null;
    fileWatcher: vscode.FileSystemWatcher = null;
    //tempFile: string = './powershell-terminal-transcript.tmp';
    tempFile: string = vscode.workspace.rootPath.replace('\\\\','/') + '/powershell-terminal-transcript.tmp';
    writeEmitter = new vscode.EventEmitter<vscode.Uri>();

    constructor(terminalName: string) {
      //  new Promise(() => {

            this.fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.tmp');//(this.tempFile);
            var listener = this.fileWatcher.onDidChange(function(uri) { 
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

    async send(terminalCommand: string) {
       // return new Promise(() => {
           await this.terminal.sendText(terminalCommand + '\r\n');
      //  });
    }

    async receive() {
      //  return new Promise(() => {
          this.fileWatcher.onDidChange;
       await console.log(this.writeEmitter.event);
      //  });
    }

    createTerminal(terminalName: string) {
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

    async disposeTerminal() {
        if (this.terminal !== null) {
            await this.send("stop-transcript");
        }
    }

}