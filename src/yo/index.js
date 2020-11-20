'use strict';
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
exports.generatorProject = void 0;
var vscode_1 = require("vscode");
var yo_1 = require("./yo/yo");
var _ = require("lodash");
var fs = require('fs');
var figures = require('figures');
var opn = require('opn');
function getWorkingFolder() {
    return __awaiter(this, void 0, void 0, function () {
        var selectedWkFolder;
        return __generator(this, function (_a) {
            if (!Array.isArray(vscode_1.workspace.workspaceFolders) || vscode_1.workspace.workspaceFolders.length === 0) {
                return [2 /*return*/, undefined];
            }
            if (vscode_1.workspace.workspaceFolders.length === 1) {
                return [2 /*return*/, vscode_1.workspace.workspaceFolders[0].uri.fsPath];
            }
            selectedWkFolder = vscode_1.window.showWorkspaceFolderPick();
            return [2 /*return*/, selectedWkFolder ? selectedWkFolder.uri.fspath : undefined];
        });
    });
}
function generatorProject(addService) {
    return __awaiter(this, void 0, void 0, function () {
        var cwd, yo, main, sub, generator, subGenerator, beforeYo, afterYo, regexp, match;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getWorkingFolder()];
                case 1:
                    cwd = _a.sent();
                    if (!cwd) {
                        vscode_1.window.showErrorMessage('Please open a workspace directory first.');
                        return [2 /*return*/];
                    }
                    yo = new yo_1["default"]({ cwd: cwd });
                    return [4 /*yield*/, vscode_1.window.showQuickPick(list(yo))];
                case 2:
                    generator = _a.sent();
                    if (generator === undefined) {
                        return [2 /*return*/];
                    }
                    main = generator.label;
                    if (!(generator.subGenerators.length > 1 && addService)) return [3 /*break*/, 4];
                    return [4 /*yield*/, runSubGenerators(generator.subGenerators)];
                case 3:
                    subGenerator = _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    subGenerator = 'app';
                    _a.label = 5;
                case 5:
                    if (subGenerator === undefined) {
                        return [2 /*return*/];
                    }
                    sub = subGenerator;
                    beforeYo = getAllDirs(cwd);
                    try {
                        yo.run(main + ":" + sub, cwd).then(function (_p) {
                            afterYo = getAllDirs(cwd);
                            var newApp = _.difference(afterYo, beforeYo);
                            if (newApp.length > 0) {
                                openFolder(newApp[0]);
                            }
                        });
                    }
                    catch (err) {
                        regexp = new RegExp('Did not provide required argument (.*?)!', 'i');
                        if (err) {
                            match = err.message.match(regexp);
                            if (match) {
                                return [2 /*return*/, sub + " " + match[1] + "?"];
                            }
                        }
                        vscode_1.window.showErrorMessage(err.message || err);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.generatorProject = generatorProject;
function openFolder(folderPath) {
    var uri = vscode_1.Uri.file(folderPath);
    vscode_1.commands.executeCommand('vscode.openFolder', uri);
}
function getAllDirs(folderPath) {
    var fs = require('fs');
    var path = require('path');
    return fs.readdirSync(folderPath)
        .map(function (name) { return path.join(folderPath, name); })
        .filter(function (filePath) { return fs.lstatSync(filePath).isDirectory(); });
}
function runSubGenerators(subGenerators) {
    var app = figures.star + " app";
    var index = subGenerators.indexOf('app');
    if (index !== -1) {
        subGenerators.splice(index, 1);
    }
    return vscode_1.window.showQuickPick(subGenerators)
        .then(function (choice) {
        if (choice === app) {
            return 'app';
        }
        return choice;
    });
}
function list(yo) {
    return new Promise(function (resolve, reject) {
        setImmediate(function () {
            yo.getEnvironment().lookup(function () {
                var generators = yo.getGenerators().map(function (generator) {
                    return {
                        label: generator.name.replace(/(^|\/)generator\-/i, '$1'),
                        description: generator.description,
                        subGenerators: generator.subGenerators
                    };
                });
                if (generators.length === 0) {
                    reject();
                    vscode_1.window.showInformationMessage('Make sure to install some generators first.', 'more info')
                        .then(function (choice) {
                        if (choice === 'more info') {
                            opn('http://yeoman.io/learning/');
                        }
                    });
                    return;
                }
                var azureGenerators = generators.filter(function (generator) {
                    return generator.label === 'azuresfcsharp'
                        || generator.label === 'azuresfjava'
                        || generator.label === 'azuresfcontainer'
                        || generator.label === 'azuresfguest';
                });
                resolve(azureGenerators);
            });
        });
    });
}
