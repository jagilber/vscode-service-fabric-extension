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
exports.removeApplication = void 0;
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
function removeApplication() {
    return __awaiter(this, void 0, void 0, function* () {
        connectToCluster();
    });
}
exports.removeApplication = removeApplication;
function connectToCluster() {
    return __awaiter(this, void 0, void 0, function* () {
        var fs = require('fs');
        var clusterData;
        var clusterInfo;
        const cloudProfile = yield vscode.workspace.findFiles('**/Cloud.json');
        const pathToCloudProfile = cloudProfile[0].fsPath.replace('/c:', '');
        yield fs.readFile(pathToCloudProfile, 'utf8', function (err, data) {
            if (err) {
                throw err;
            }
            clusterData = JSON.parse(data);
            clusterInfo = clusterData.ClusterConnectionParameters;
            if (clusterInfo.ClientCert.length > 0) {
                connectToSecureCluster(clusterInfo);
            }
            else {
                connectToUnsecureCluster(clusterInfo);
            }
        });
        return clusterInfo;
    });
}
function connectToSecureCluster(clusterInfo) {
    var terminal = vscode.window.createTerminal('ServiceFabric');
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
        terminal.sendText("Connect-ServiceFabricCluster -ConnectionEndPoint " + clusterInfo.ConnectionIPOrURL + ':' + clusterInfo.ConnectionPort + " -X509Credential -ServerCertThumbprint " + clusterInfo.ServerCertThumbprint + " -FindType FindByThumbprint -FindValue " + clusterInfo.ClientCertThumbprint + " -StoreLocation CurrentUser -StoreName My");
        terminal.show();
    }
    uninstallApplication(terminal);
}
function connectToUnsecureCluster(clusterInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        var terminal = vscode.window.createTerminal('ServiceFabric');
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
                terminal.sendText("Connect-ServiceFabricCluster -ConnectionEndPoint localhost:19000");
                terminal.show();
            }
        }
        uninstallApplication(terminal);
    });
}
function uninstallApplication(terminal) {
    return __awaiter(this, void 0, void 0, function* () {
        var uri = null;
        uri = yield vscode.workspace.findFiles('**/uninstall' + installScriptExtension);
        if (uri.length < 1) {
            vscode.window.showErrorMessage("An uninstall file was not found in the workspace");
            return;
        }
        const relativeInstallPath = vscode.workspace.asRelativePath(uri[0]);
        terminal.sendText('./' + relativeInstallPath);
        terminal.show();
    });
}
//# sourceMappingURL=remove-application.js.map