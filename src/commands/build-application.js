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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.buildCSharpApplication = exports.buildGradleApplication = exports.buildApplication = void 0;
var vscode = require("vscode");
var vars = require("./osdetector");
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
    return __awaiter(this, void 0, void 0, function () {
        var languageType, buildFiles, uris;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, vscode.workspace.findFiles('**/build.gradle')];
                case 1:
                    buildFiles = _a.sent();
                    if (buildFiles.length < 1)
                        languageType = 'C#';
                    else
                        languageType = 'Java';
                    return [4 /*yield*/, vscode.workspace.findFiles('**/Cloud.json')];
                case 2:
                    uris = _a.sent();
                    if (uris.length < 1) {
                        createPublishProfile();
                    }
                    if (languageType === 'Java') {
                        buildGradleApplication();
                    }
                    else if (languageType === 'C#') {
                        buildCSharpApplication(true);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.buildApplication = buildApplication;
function buildGradleApplication() {
    return __awaiter(this, void 0, void 0, function () {
        var uris, projectPath, projectUri, terminal;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, vscode.workspace.findFiles('**/build.gradle')];
                case 1:
                    uris = _a.sent();
                    if (uris.length < 1) {
                        vscode.window.showErrorMessage("A build.gradle file was not found in the workspace");
                        return [2 /*return*/];
                    }
                    projectPath = uris[0].path.replace('build.gradle', '');
                    projectUri = vscode.Uri.parse(projectPath);
                    terminal = vscode.window.createTerminal('ServiceFabric');
                    terminal.sendText('gradle ');
                    terminal.show();
                    return [2 /*return*/];
            }
        });
    });
}
exports.buildGradleApplication = buildGradleApplication;
function buildCSharpApplication(showTerminal) {
    return __awaiter(this, void 0, void 0, function () {
        var uris, buildPath, relativeBuildPath, terminal, commands, fs, outpath, content;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    uris = null;
                    return [4 /*yield*/, vscode.workspace.findFiles('**/build' + builScriptExtension)];
                case 1:
                    uris = _a.sent();
                    if (uris.length < 1) {
                        vscode.window.showErrorMessage("A build file was not found in the workspace");
                        return [2 /*return*/, 1];
                    }
                    buildPath = uris[0].fsPath.replace('/c:', '');
                    replaceBuildPath(buildPath);
                    relativeBuildPath = vscode.workspace.asRelativePath(uris[0]);
                    terminal = vscode.window.createTerminal('ServiceFabric');
                    commands = "./" + relativeBuildPath;
                    terminal.sendText(commands, true);
                    if (showTerminal) {
                        terminal.show();
                        return [2 /*return*/, 0];
                    }
                    else {
                        //This is path for testing. To check whether the build command is successfully sent to terminal
                        terminal.show(true);
                        terminal.sendText('$? > TestCSharpApplication/out.out', true);
                        fs = require('fs');
                        console.log(vscode.workspace.workspaceFolders[0].uri.fsPath);
                        outpath = vscode.workspace.workspaceFolders[0].uri.fsPath + '/TestCSharpApplication/out.out';
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                setTimeout(function () {
                                    content = fs.readFileSync(outpath, 'utf8');
                                    if (content.includes('T'))
                                        resolve(0);
                                    else
                                        reject(1);
                                }, 30000);
                            })];
                    }
                    return [2 /*return*/];
            }
        });
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
    return __awaiter(this, void 0, void 0, function () {
        var publishParams, publishParamsJson, uri, buildPath, fs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    publishParams = {
                        ClusterConnectionParameters: {
                            ConnectionIPOrURL: '',
                            ConnectionPort: '19080',
                            ClientKey: '',
                            ClientCert: '',
                            ServerCertThumbprint: '',
                            ClientCertThumbprint: ''
                        }
                    };
                    publishParamsJson = JSON.stringify(publishParams, null, 4);
                    uri = null;
                    return [4 /*yield*/, vscode.workspace.findFiles('**/install' + installScriptExtension)];
                case 1:
                    uri = _a.sent();
                    if (uri.length < 1) {
                        vscode.window.showErrorMessage("An install file was not found in the workspace");
                        return [2 /*return*/];
                    }
                    buildPath = uri[0].fsPath.replace('/c:', '').replace('install' + installScriptExtension, '');
                    console.log('Build Path: ' + buildPath);
                    fs = require('fs');
                    fs.writeFile(buildPath + 'Cloud.json', publishParamsJson, 'utf8', function (err) {
                        if (err)
                            throw err;
                        console.log('Completed!');
                    });
                    return [2 /*return*/];
            }
        });
    });
}
