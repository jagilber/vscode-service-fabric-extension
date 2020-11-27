import * as pwsh from './powershell-terminal';
import * as vscode from "vscode";
import * as vars from './osdetector';
const exec = require('child_process').exec;

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
    var t = new pwsh.powershellTerminal('ServiceFabric');
    //await t.initialize('ServiceFabric');
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
    const pty: vscode.Pseudoterminal = {
        onDidWrite: writeEmitter.event,
        open: () => { writeEmitter.fire('Opening Terminal') },
        close: () => { },
        handleInput: data => writeEmitter.fire(data)
        //handleInput: data => writeEmitter.fire(data === '\r' ? '\r\n' : data)
    };
    var terminal = vscode.window.createTerminal({ name: 'Local echo', pty: pty });

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
        terminal.sendText('import-module servicefabric;\r\n');
        terminal.sendText("Connect-ServiceFabricCluster -ConnectionEndPoint " + clusterInfo.ConnectionIPOrURL + ':' + clusterInfo.ConnectionPort + " -X509Credential -ServerCertThumbprint " + clusterInfo.ServerCertThumbprint + " -FindType FindByThumbprint -FindValue " + clusterInfo.ClientCertThumbprint + " -StoreLocation CurrentUser -StoreName My;\r\n");
    }
    installApplication(terminal);
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
    terminal.sendText('./' + relativeInstallPath + '\r\n');
    terminal.show();
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
