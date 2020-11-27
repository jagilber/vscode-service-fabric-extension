//debugger;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as vscode from 'vscode';
import * as pwsh from './commands/powershell-terminal';
import { addSFService } from './commands/add-sf-service';
import { buildApplication } from './commands/build-application';
import { cleanJavaApplication } from './commands/clean-application-java';
import { createApplication } from './commands/create-application';
import { deployApplication } from './commands/deploy-application';
import { publishApplication } from './commands/publish-application';
import { removeApplication } from './commands/remove-application';
import { upgradeApplication } from './commands/upgrade-application';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	//var t = new pwsh.powershellTerminal('ServiceFabric');
	//var t = new pwsh.powershellTerminal();

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
	context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.addSFService', addSFService));
	context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.buildApplication', buildApplication));
	context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.cleanJavaApplication', cleanJavaApplication));
	context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.createApplication', createApplication));
	context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.deployApplication', deployApplication));
	context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.publishApplication', publishApplication));
	context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.removeApplication', removeApplication));
	context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.upgradeApplication', upgradeApplication));
}

// this method is called when your extension is deactivated
export function deactivate() { }
