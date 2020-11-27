"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
debugger;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
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
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    var t = new pwsh.powershellTerminal('ServiceFabric');
    t.send('dir');
    t.receive();
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
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
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map