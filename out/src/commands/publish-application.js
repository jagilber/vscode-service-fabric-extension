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
exports.publishApplication = void 0;
const pwsh = require("./powershell-terminal");
const vscode = require("vscode");
const vars = require("./osdetector");
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
function publishApplication() {
    return __awaiter(this, void 0, void 0, function* () {
        var t = new pwsh.powershellTerminal('ServiceFabric');
        //await t.initialize('ServiceFabric');
        // var s: string = await t.send('dir');
        // var r: string = await t.receive(s);
        // var j: string = await t.readJson(r);
        //
        console.log(`finished await ${yield t.readJson(yield t.send('dir'))}`);
        yield readCloudProfile();
    });
}
exports.publishApplication = publishApplication;
function deployToUnsecureCluster(clusterInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        var terminal = vscode.window.createTerminal('ServiceFabric');
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
    });
}
function deployToSecureClusterCert(clusterInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        const writeEmitter = new vscode.EventEmitter();
        const pty = {
            onDidWrite: writeEmitter.event,
            open: () => { writeEmitter.fire('Opening Terminal'); },
            close: () => { },
            handleInput: data => writeEmitter.fire(data)
            //handleInput: data => writeEmitter.fire(data === '\r' ? '\r\n' : data)
        };
        var terminal = vscode.window.createTerminal({ name: 'Local echo', pty: pty });
        yield terminal.show();
        yield pty.onDidWrite(() => console.log);
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
    });
}
function installApplication(terminal) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Install Application");
        var uri = null;
        uri = yield vscode.workspace.findFiles('**/install' + installScriptExtension);
        if (uri.length < 1) {
            vscode.window.showErrorMessage("An install file was not found in the workspace");
            return;
        }
        const relativeInstallPath = vscode.workspace.asRelativePath(uri[0]);
        terminal.sendText('./' + relativeInstallPath + '\r\n');
        terminal.show();
    });
}
function readCloudProfile() {
    return __awaiter(this, void 0, void 0, function* () {
        var fs = require('fs');
        const cloudProfile = yield vscode.workspace.findFiles('**/Cloud.json');
        if (cloudProfile.length < 1) {
            vscode.window.showErrorMessage("Could not find configuration file Cloud.json. Please ensure that the application package is built using the build command before executing publish.");
            return;
        }
        const pathToCloudProfile = cloudProfile[0].fsPath.replace('/c:', '');
        yield fs.readFile(pathToCloudProfile, 'utf8', function (err, data) {
            if (err) {
                throw err;
            }
            var clusterData = JSON.parse(data);
            var clusterInfo = clusterData.ClusterConnectionParameters;
            if (clusterInfo.ClientCert.length > 0 || clusterInfo.ClientCertThumbprint.length > 0) {
                deployToSecureClusterCert(clusterInfo);
            }
            else {
                deployToUnsecureCluster(clusterInfo);
            }
        });
    });
}
//# sourceMappingURL=publish-application.js.map