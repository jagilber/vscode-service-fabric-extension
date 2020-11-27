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
exports.buildCSharpApplication = exports.buildGradleApplication = exports.buildApplication = void 0;
const vscode = require("vscode");
const vars = require("./osdetector");
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
function buildApplication() {
    return __awaiter(this, void 0, void 0, function* () {
        var languageType;
        const buildFiles = yield vscode.workspace.findFiles('**/build.gradle');
        if (buildFiles.length < 1)
            languageType = 'C#';
        else
            languageType = 'Java';
        const uris = yield vscode.workspace.findFiles('**/Cloud.json');
        if (uris.length < 1) {
            createPublishProfile();
        }
        if (languageType === 'Java') {
            buildGradleApplication();
        }
        else if (languageType === 'C#') {
            buildCSharpApplication(true);
        }
    });
}
exports.buildApplication = buildApplication;
function buildGradleApplication() {
    return __awaiter(this, void 0, void 0, function* () {
        const uris = yield vscode.workspace.findFiles('**/build.gradle');
        if (uris.length < 1) {
            vscode.window.showErrorMessage("A build.gradle file was not found in the workspace");
            return;
        }
        const projectPath = uris[0].path.replace('build.gradle', '');
        let projectUri = vscode.Uri.parse(projectPath);
        const terminal = vscode.window.createTerminal('ServiceFabric');
        terminal.sendText('gradle ');
        terminal.show();
    });
}
exports.buildGradleApplication = buildGradleApplication;
function buildCSharpApplication(showTerminal) {
    return __awaiter(this, void 0, void 0, function* () {
        var uris = null;
        uris = yield vscode.workspace.findFiles('**/build' + builScriptExtension);
        if (uris.length < 1) {
            vscode.window.showErrorMessage("A build file was not found in the workspace");
            return 1;
        }
        const buildPath = uris[0].fsPath.replace('/c:', '');
        replaceBuildPath(buildPath);
        const relativeBuildPath = vscode.workspace.asRelativePath(uris[0]);
        const terminal = vscode.window.createTerminal('ServiceFabric');
        var commands = "./" + relativeBuildPath;
        terminal.sendText(commands, true);
        if (showTerminal) {
            terminal.show();
            return 0;
        }
        else {
            //This is path for testing. To check whether the build command is successfully sent to terminal
            terminal.show(true);
            terminal.sendText('$? > TestCSharpApplication/out.out', true);
            var fs = require('fs');
            console.log(vscode.workspace.workspaceFolders[0].uri.fsPath);
            var outpath = vscode.workspace.workspaceFolders[0].uri.fsPath + '/TestCSharpApplication/out.out';
            var content;
            return new Promise((resolve, reject) => {
                setTimeout(function () {
                    content = fs.readFileSync(outpath, 'utf8');
                    if (content.includes('T'))
                        resolve(0);
                    else
                        reject(1);
                }, 30000);
            });
        }
    });
}
exports.buildCSharpApplication = buildCSharpApplication;
function replaceBuildPath(filePath) {
    var fs = require('fs');
    fs.readFile(filePath, 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        var result = data.replace(/\\/g, "/");
        fs.writeFile(filePath, result, 'utf8', function (err) {
            if (err)
                return console.log(err);
        });
    });
}
function createPublishProfile() {
    return __awaiter(this, void 0, void 0, function* () {
        var publishParams = {
            ClusterConnectionParameters: {
                ConnectionIPOrURL: '',
                ConnectionPort: '19080',
                ClientKey: '',
                ClientCert: '',
                ServerCertThumbprint: '',
                ClientCertThumbprint: ''
            }
        };
        var publishParamsJson = JSON.stringify(publishParams, null, 4);
        var uri = null;
        var buildPath;
        uri = yield vscode.workspace.findFiles('**/install' + installScriptExtension);
        if (uri.length < 1) {
            vscode.window.showErrorMessage("An install file was not found in the workspace");
            return;
        }
        buildPath = uri[0].fsPath.replace('/c:', '').replace('install' + installScriptExtension, '');
        console.log('Build Path: ' + buildPath);
        var fs = require('fs');
        fs.writeFile(buildPath + 'Cloud.json', publishParamsJson, 'utf8', function (err) {
            if (err)
                throw err;
            console.log('Completed!');
        });
    });
}
//# sourceMappingURL=build-application.js.map