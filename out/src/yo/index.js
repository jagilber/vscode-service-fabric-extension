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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatorProject = void 0;
const vscode_1 = require("vscode");
const yo_1 = require("./yo/yo");
const _ = require("lodash");
const fs = require('fs');
const figures = require('figures');
const opn = require('opn');
function getWorkingFolder() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!Array.isArray(vscode_1.workspace.workspaceFolders) || vscode_1.workspace.workspaceFolders.length === 0) {
            return undefined;
        }
        if (vscode_1.workspace.workspaceFolders.length === 1) {
            return vscode_1.workspace.workspaceFolders[0].uri.fsPath;
        }
        const selectedWkFolder = vscode_1.window.showWorkspaceFolderPick();
        return selectedWkFolder ? selectedWkFolder.uri.fspath : undefined;
    });
}
function generatorProject(addService) {
    return __awaiter(this, void 0, void 0, function* () {
        const cwd = yield getWorkingFolder();
        if (!cwd) {
            vscode_1.window.showErrorMessage('Please open a workspace directory first.');
            return;
        }
        const yo = new yo_1.default({ cwd });
        let main;
        let sub;
        const generator = yield vscode_1.window.showQuickPick(list(yo));
        if (generator === undefined) {
            return;
        }
        main = generator.label;
        let subGenerator;
        if (generator.subGenerators.length > 1 && addService) {
            subGenerator = yield runSubGenerators(generator.subGenerators);
        }
        else {
            subGenerator = 'app';
        }
        if (subGenerator === undefined) {
            return;
        }
        sub = subGenerator;
        var beforeYo = getAllDirs(cwd);
        var afterYo;
        try {
            yo.run(`${main}:${sub}`, cwd).then(_p => {
                afterYo = getAllDirs(cwd);
                var newApp = _.difference(afterYo, beforeYo);
                if (newApp.length > 0) {
                    openFolder(newApp[0]);
                }
            });
        }
        catch (err) {
            const regexp = new RegExp('Did not provide required argument (.*?)!', 'i');
            if (err) {
                const match = err.message.match(regexp);
                if (match) {
                    return `${sub} ${match[1]}?`;
                }
            }
            vscode_1.window.showErrorMessage(err.message || err);
        }
    });
}
exports.generatorProject = generatorProject;
function openFolder(folderPath) {
    let uri = vscode_1.Uri.file(folderPath);
    vscode_1.commands.executeCommand('vscode.openFolder', uri);
}
function getAllDirs(folderPath) {
    const fs = require('fs');
    const path = require('path');
    return fs.readdirSync(folderPath)
        .map(name => path.join(folderPath, name))
        .filter(filePath => fs.lstatSync(filePath).isDirectory());
}
function runSubGenerators(subGenerators) {
    const app = `${figures.star} app`;
    const index = subGenerators.indexOf('app');
    if (index !== -1) {
        subGenerators.splice(index, 1);
    }
    return vscode_1.window.showQuickPick(subGenerators)
        .then(choice => {
        if (choice === app) {
            return 'app';
        }
        return choice;
    });
}
function list(yo) {
    return new Promise((resolve, reject) => {
        setImmediate(() => {
            yo.getEnvironment().lookup(() => {
                const generators = yo.getGenerators().map(generator => {
                    return {
                        label: generator.name.replace(/(^|\/)generator\-/i, '$1'),
                        description: generator.description,
                        subGenerators: generator.subGenerators
                    };
                });
                if (generators.length === 0) {
                    reject();
                    vscode_1.window.showInformationMessage('Make sure to install some generators first.', 'more info')
                        .then(choice => {
                        if (choice === 'more info') {
                            opn('http://yeoman.io/learning/');
                        }
                    });
                    return;
                }
                const azureGenerators = generators.filter(generator => {
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
//# sourceMappingURL=../../src/out/yo/index.js.map