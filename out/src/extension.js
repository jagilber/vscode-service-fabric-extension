"use strict";
//debugger;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
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
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const pwsh = require("./commands/powershell-terminal");
const add_sf_service_1 = require("./commands/add-sf-service");
const build_application_1 = require("./commands/build-application");
const clean_application_java_1 = require("./commands/clean-application-java");
const create_application_1 = require("./commands/create-application");
const deploy_application_1 = require("./commands/deploy-application");
const publish_application_1 = require("./commands/publish-application");
const remove_application_1 = require("./commands/remove-application");
const upgrade_application_1 = require("./commands/upgrade-application");
const terminal = new pwsh.powershellTerminal();
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        // Use the console to output diagnostic information (console.log) and errors (console.error)
        // This line of code will only be executed once when your extension is activated
        yield terminal.initialize('Service Fabric');
        var results = null;
        try {
            results = yield terminal.sendReceive('import-module servicefabric');
            console.log(`results: ${results}`);
        }
        catch (_a) {
            results = yield terminal.sendReceive('iwr https://raw.githubusercontent.com/jagilber/powershellScripts/master/serviceFabric/sf-download-cab.ps1 \
			-out $pwd/sf-download-cab.ps1;\
			$pwd/sf-download-cab.ps1 -install $true');
            console.log(`results: ${results}`);
        }
        // try {
        // 	results = await terminal.sendReceive('import-module servicefabric');
        // 	console.log(`results: ${results}`);
        // }
        // catch {
        // 	results = await terminal.sendReceive('iwr https://raw.githubusercontent.com/jagilber/powershellScripts/master/serviceFabric/sf-install-sdk.ps1 -out $pwd/sf-install-sdk.ps1;$pwd/sf-install-sdk.ps1');
        // 	console.log(`results: ${results}`);
        // }
        console.log('Congratulations, your extension "service-fabric-services" is now active!');
        // The command has been defined in the package.json file
        // Now provide the implementation of the command with registerCommand
        // The commandId parameter must match the command field in package.json
        let disposable = vscode.commands.registerCommand('service-fabric-services.helloWorld', () => {
            // The code you place here will be executed every time your command is executed
            // Display a message box to the user
            vscode.window.showInformationMessage('Hello World from Service Fabric Reliable Services!');
        });
        context.subscriptions.push(disposable);
        // Registering all of the possible commands for interacting with a Service Fabric Project
        context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.addSFService', add_sf_service_1.addSFService));
        context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.buildApplication', build_application_1.buildApplication));
        context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.cleanJavaApplication', clean_application_java_1.cleanJavaApplication));
        context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.createApplication', create_application_1.createApplication));
        context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.deployApplication', deploy_application_1.deployApplication));
        context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.publishApplication', publish_application_1.publishApplication));
        context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.removeApplication', remove_application_1.removeApplication));
        context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.upgradeApplication', upgrade_application_1.upgradeApplication));
        // vscode.window.registerTerminalLinkProvider
        context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.registerTerminalLinkProvider', () => {
            vscode.window.registerTerminalLinkProvider({
                provideTerminalLinks: (context, token) => {
                    // Detect the first instance of the word "link" if it exists and linkify it
                    console.log(context);
                    const startIndex = 0; //(context.line as string).indexOf('link');
                    const contextLength = context.line.length;
                    if (startIndex === contextLength) {
                        return [];
                    }
                    return [
                        {
                            startIndex,
                            length: contextLength,
                            tooltip: 'Show a notification',
                            // You can return data in this object to access inside handleTerminalLink
                            data: context.line //'Example data'
                        }
                    ];
                },
                handleTerminalLink: (link) => {
                    vscode.window.showInformationMessage(`Link activated (data = ${link.data})`);
                }
            });
        }));
    });
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
    if (terminal !== null) {
        terminal.disposeTerminal();
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map