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
exports.deployApplication = void 0;
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
function deployApplication() {
    return __awaiter(this, void 0, void 0, function* () {
        var terminal = vscode.window.createTerminal('ServiceFabric');
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
            var buildFiles = yield vscode.workspace.findFiles('**/build.gradle');
            if (buildFiles.length > 1) {
                vscode.window.showErrorMessage("Sorry! You cannot deploy Service Fabric Java application to Windows Cluster");
                return;
            }
            terminal.show();
            terminal.sendText("Connect-ServiceFabricCluster -ConnectionEndpoint localhost:19000");
        }
        installApplication(terminal);
    });
}
exports.deployApplication = deployApplication;
function installApplication(terminal) {
    return __awaiter(this, void 0, void 0, function* () {
        var uri = null;
        uri = yield vscode.workspace.findFiles('**/install' + installScriptExtension);
        if (uri.length < 1) {
            vscode.window.showErrorMessage("An install file was not found in the workspace");
            return;
        }
        const relativeInstallPath = vscode.workspace.asRelativePath(uri[0]);
        terminal.sendText('./' + relativeInstallPath);
        terminal.show();
    });
}
//# sourceMappingURL=deploy-application.js.map