import * as pwsh from './powershell-terminal';
import * as vscode from "vscode";
import * as vars from './osdetector';
const exec = require('child_process').exec;
const fsWatcher = require('fs'); 
const outputFile = "/temp/test.txt";
var builScriptExtension;
var installScriptExtension;

if (vars._isWindows) {
    builScriptExtension = '.cmd';
    installScriptExtension = '.ps1';
}

else {
    builScriptExtension = '.sh';
    installScriptExtension = '.sh';
}

export async function publishApplication() {
    var t = new pwsh.powershellTerminal();
    await t.initialize('ServiceFabric');
    // var s: string = await t.send('dir');
    // var r: string = await t.receive(s);
    // var j: string = await t.readJson(r);
    //

     console.log(`finished await ${await t.readJson(await t.send('dir'))}`);

    await readCloudProfile();
}

async function deployToUnsecureCluster(clusterInfo) {
    var terminal: vscode.Terminal = vscode.window.createTerminal('ServiceFabric');
    terminal.sendText('import-module servicefabric;');
    if (clusterInfo.ConnectionIPOrURL.length > 0) {
        if (vars._isLinux || vars._isMacintosh) {
            exec('sfctl cluster select --endpoint ' + clusterInfo.ConnectionIPOrURL + ':' + clusterInfo.ConnectionPort, function (err, stdout, stderr) {
                if (err) {
                    vscode.window.showErrorMessage("Could not connect to cluster.");
                    console.log(err);
                    return;
                }
            });
        }
        else if (vars._isWindows) {
            terminal.sendText("Connect-ServiceFabricCluster -ConnectionEndPoint " + clusterInfo.ConnectionIPOrURL + ':' + clusterInfo.ConnectionPort);
            terminal.show();
        }
    }
    else {
        if (vars._isLinux || vars._isMacintosh) {
            exec('sfctl cluster select --endpoint http://localhost:19080', function (err, stdout, stderr) {
                if (err) {
                    vscode.window.showErrorMessage("Could not connect to cluster.");
                    console.log(err);
                    return;
                }
            });
        }
        else if (vars._isWindows) {
            terminal.sendText("Connect-ServiceFabricCluster -ConnectionEndpoint localhost:19000");
            terminal.show();
        }
    }
    installApplication(terminal);
}

async function deployToSecureClusterCert(clusterInfo) {

    const writeEmitter = new vscode.EventEmitter<string>();
    var subterminal: vscode.Terminal = vscode.window.createTerminal('ServiceFabric');
    
    fsWatcher.watchFile(outputFile,{
        bigint: false,
        persistent: true,
        interval: 500
    },(curr,prev) =>{
        console.log('previous',prev.mtime);
        console.log('current',curr.mtime);
    });
    
    fsWatcher.watch(outputFile, (eventType, filename) => { 
        if (fsWatcher.readFileSync(outputFile, { encoding: 'utf8', flag: 'r' }).length < 1) {
            return;
        }

        console.log("\nThe file", filename, "was modified!"); 
        console.log("The type of change was:", eventType); 
        console.log(fsWatcher.readFileSync(outputFile,{encoding:'utf8', flag:'r'}));
        terminal.sendText(fsWatcher.readFileSync(outputFile, { encoding: 'utf8', flag: 'r' }),true);
        //terminal.sendText('\n\n',true);
        fsWatcher.writeFileSync(outputFile,"");
      }); 


    const pty: vscode.Pseudoterminal = {
        onDidWrite: writeEmitter.event,
        open: () => { 
            writeEmitter.fire('Opening Terminal'); 
            writeEmitter.fire('\r\n'); 
        },
        close: () => { },
        handleInput: data => {
            writeEmitter.fire(data.replace(/\r/g,'\r\n',));
            //subterminal.sendText(data);
        },
    };

    await terminal.show();
    await pty.onDidWrite(() => console.log);
    //var terminal: vscode.Terminal = vscode.window.createTerminal('ServiceFabric');

    if (vars._isLinux || vars._isMacintosh) {
        exec('sfctl cluster select --endpoint ' + clusterInfo.ConnectionIPOrURL + ':' + clusterInfo.ConnectionPort + ' --cert ' + clusterInfo.ClientCert + ' --key ' + clusterInfo.ClientKey + ' --no-verify', function (err, stdout, stderr) {
            if (err) {
                vscode.window.showErrorMessage("Could not connect to cluster.");
                console.log(err);
                return;
            }
        });
    }
    else if (vars._isWindows) {
        terminal.show();
        subterminal.sendText('import-module servicefabric >>' + outputFile);
        //terminal.sendText('\r');
        subterminal.sendText("Connect-ServiceFabricCluster -ConnectionEndPoint " + clusterInfo.ConnectionIPOrURL + ':' + clusterInfo.ConnectionPort + " -X509Credential -ServerCertThumbprint " + clusterInfo.ServerCertThumbprint + " -FindType FindByThumbprint -FindValue " + clusterInfo.ClientCertThumbprint + " -StoreLocation CurrentUser -StoreName My >>" + outputFile);
        //terminal.sendText('\r');
    }
    installApplication(subterminal);
}

async function installApplication(terminal: vscode.Terminal) {
    console.log("Install Application");
    var uri: vscode.Uri[] = null;
    uri = await vscode.workspace.findFiles('**/install' + installScriptExtension);
    if (uri.length < 1) {
        vscode.window.showErrorMessage("An install file was not found in the workspace");
        return;
    }
    const relativeInstallPath = vscode.workspace.asRelativePath(uri[0]);
    terminal.sendText('./' + relativeInstallPath + ' >>' + outputFile);
//    terminal.show();
}


async function readCloudProfile() {
    var fs = require('fs');
    const cloudProfile: vscode.Uri[] = await vscode.workspace.findFiles('**/Cloud.json');
    if (cloudProfile.length < 1) {
        vscode.window.showErrorMessage("Could not find configuration file Cloud.json. Please ensure that the application package is built using the build command before executing publish.");
        return;
    }

    const pathToCloudProfile = cloudProfile[0].fsPath.replace('/c:', '');
    await fs.readFile(pathToCloudProfile, 'utf8', function (err, data) {
        if (err) {
            throw err;
        }
        var clusterData = JSON.parse(data);
        var clusterInfo = clusterData.ClusterConnectionParameters;
        if (clusterInfo.ClientCert.length > 0 || clusterInfo.ClientCertThumbprint.length > 0) {
            deployToSecureClusterCert(clusterInfo);
        } else {
            deployToUnsecureCluster(clusterInfo);
        }
    });
}
