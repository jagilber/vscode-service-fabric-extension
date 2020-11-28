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
exports.upgradeApplication = void 0;
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
function upgradeApplication() {
    return __awaiter(this, void 0, void 0, function* () {
        var version = yield readVersionFromManifest();
        var clusterInfo = yield readCloudProfile();
        if (clusterInfo.ClientCert.length > 0 || clusterInfo.ClientCertThumbprint.length > 0) {
            deployToSecureClusterCert(clusterInfo, version);
        }
        else {
            deployToUnsecureCluster(clusterInfo, version);
        }
    });
}
exports.upgradeApplication = upgradeApplication;
function deployToUnsecureCluster(clusterInfo, version) {
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
                terminal.sendText("Connect-ServiceFabricCluster -ConnectionEndpoint localhost:19000");
                terminal.show();
            }
        }
        installApplication(terminal, version);
    });
}
function deployToSecureClusterCert(clusterInfo, version) {
    return __awaiter(this, void 0, void 0, function* () {
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
            terminal.show();
            terminal.sendText("Connect-ServiceFabricCluster -ConnectionEndPoint " + clusterInfo.ConnectionIPOrURL + ':' + clusterInfo.ConnectionPort + " -X509Credential -ServerCertThumbprint " + clusterInfo.ServerCertThumbprint + " -FindType FindByThumbprint -FindValue " + clusterInfo.ClientCertThumbprint + " -StoreLocation CurrentUser -StoreName My");
        }
        installApplication(terminal, version);
    });
}
function installApplication(terminal, version) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Upgrade Application");
        var uri = null;
        uri = yield vscode.workspace.findFiles('**/upgrade' + installScriptExtension);
        if (uri.length < 1) {
            vscode.window.showErrorMessage("An upgrade file was not found in the workspace");
            return;
        }
        const relativeInstallPath = vscode.workspace.asRelativePath(uri[0]);
        terminal.sendText('./' + relativeInstallPath + ' -version ' + version);
        terminal.show();
    });
}
function readVersionFromManifest() {
    return __awaiter(this, void 0, void 0, function* () {
        var fs = require('fs');
        const cloudProfile = yield vscode.workspace.findFiles('**/ApplicationManifest.xml');
        const pathToCloudProfile = cloudProfile[0].fsPath.replace('/c:', '');
        const manifest = fs.readFileSync(pathToCloudProfile).toString('utf8');
        var manifestJs;
        var parseString = require('xml2js').parseString;
        parseString(manifest, function (err, result) {
            manifestJs = result;
        });
        var version = manifestJs['ApplicationManifest']['$']['ApplicationTypeVersion'];
        return version;
    });
}
function readCloudProfile() {
    return __awaiter(this, void 0, void 0, function* () {
        var fs = require('fs');
        const cloudProfile = yield vscode.workspace.findFiles('**/Cloud.json');
        const pathToCloudProfile = cloudProfile[0].fsPath.replace('/c:', '');
        const profile = fs.readFileSync(pathToCloudProfile).toString('utf8');
        var clusterData = JSON.parse(profile);
        var clusterInfo = clusterData.ClusterConnectionParameters;
        return clusterInfo;
    });
}
//# sourceMappingURL=upgrade-application.js.map