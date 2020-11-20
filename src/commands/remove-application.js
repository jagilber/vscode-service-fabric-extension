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
exports.removeApplication = void 0;
var vscode = require("vscode");
var vars = require("./osdetector");
var exec = require('child_process').exec;
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
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            connectToCluster();
            return [2 /*return*/];
        });
    });
}
exports.removeApplication = removeApplication;
function connectToCluster() {
    return __awaiter(this, void 0, void 0, function () {
        var fs, clusterData, clusterInfo, cloudProfile, pathToCloudProfile;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fs = require('fs');
                    return [4 /*yield*/, vscode.workspace.findFiles('**/Cloud.json')];
                case 1:
                    cloudProfile = _a.sent();
                    pathToCloudProfile = cloudProfile[0].fsPath.replace('/c:', '');
                    return [4 /*yield*/, fs.readFile(pathToCloudProfile, 'utf8', function (err, data) {
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
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, clusterInfo];
            }
        });
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
    return __awaiter(this, void 0, void 0, function () {
        var terminal;
        return __generator(this, function (_a) {
            terminal = vscode.window.createTerminal('ServiceFabric');
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
            return [2 /*return*/];
        });
    });
}
function uninstallApplication(terminal) {
    return __awaiter(this, void 0, void 0, function () {
        var uri, relativeInstallPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    uri = null;
                    return [4 /*yield*/, vscode.workspace.findFiles('**/uninstall' + installScriptExtension)];
                case 1:
                    uri = _a.sent();
                    if (uri.length < 1) {
                        vscode.window.showErrorMessage("An uninstall file was not found in the workspace");
                        return [2 /*return*/];
                    }
                    relativeInstallPath = vscode.workspace.asRelativePath(uri[0]);
                    terminal.sendText('./' + relativeInstallPath);
                    terminal.show();
                    return [2 /*return*/];
            }
        });
    });
}
