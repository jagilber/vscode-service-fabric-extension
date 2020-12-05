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
const terminal = new pwsh.powershellTerminal(['servicefabric']);

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated

	var results: string = null;
	try {
		await terminal.initialize('Service Fabric');
		await terminal.sendReceiveText('npm');
		await terminal.sendReceiveText('az');
		await terminal.sendReceiveText('git');
		await terminal.sendReceiveText('yo --help');
		
		try {
			await terminal.sendReceiveText('deploy-servicefabricapplication');
		}
		catch {
			results = await terminal.sendReceiveText(
				'iwr "https://raw.githubusercontent.com/jagilber/powershellScripts/master/serviceFabric/sf-download-cab.ps1" -out "$pwd/sf-download-cab.ps1";\
				. $pwd/sf-download-cab.ps1 -install $true'
			);
			console.log(`results: ${results}`);
		}
	}
	catch (error) {
		await terminal.send('error checking prerequisites. this extension requires: nodejs, az,	git, yo');
		console.error(error);
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
	context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.addSFService', addSFService));
	context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.buildApplication', buildApplication));
	context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.cleanJavaApplication', cleanJavaApplication));
	context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.createApplication', createApplication));
	context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.deployApplication', deployApplication));
	context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.publishApplication', publishApplication));
	context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.removeApplication', removeApplication));
	context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.upgradeApplication', upgradeApplication));
	// vscode.window.registerTerminalLinkProvider
	context.subscriptions.push(vscode.commands.registerCommand('vscode-sf.registerTerminalLinkProvider', () => {
		(<any>vscode.window).registerTerminalLinkProvider({
			provideTerminalLinks: (context: any, token: vscode.CancellationToken) => {
				// Detect the first instance of the word "link" if it exists and linkify it
				console.log(context as string);
				const startIndex = 0;//(context.line as string).indexOf('link');
				const contextLength = (context.line as string).length;
				if (startIndex === contextLength) {
					return [];
				}
				return [
					{
						startIndex,
						length: contextLength,
						tooltip: 'Show a notification',
						// You can return data in this object to access inside handleTerminalLink
						data: (context.line as string) //'Example data'
					}
				];
			},
			handleTerminalLink: (link: any) => {
				vscode.window.showInformationMessage(`Link activated (data = ${link.data})`);
			}
		});
	}));
}

// this method is called when your extension is deactivated
export async function deactivate() {
	if (terminal !== null) {
		await terminal.disposeTerminal();
	}
}
