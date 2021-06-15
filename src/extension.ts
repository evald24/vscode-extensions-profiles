// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { Commands, CommandTypes } from "./commands";

export async function activate(ctx: vscode.ExtensionContext) {
  console.log('"vscode-extension-profiles" is now active!');

  // Registration commands
  for (const key in Commands) {
    ctx.subscriptions.push(vscode.commands.registerCommand(key, () => Commands[key as typeof CommandTypes[number]]({ ctx })));
  }
}

export function deactivate() {}
