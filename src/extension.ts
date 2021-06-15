import * as vscode from "vscode";
import { Commands, CommandTypes } from "./commands";

export async function activate(ctx: vscode.ExtensionContext) {
  // Registration commands
  for (const key in Commands) {
    ctx.subscriptions.push(vscode.commands.registerCommand(key, () => Commands[key as typeof CommandTypes[number]]({ ctx })));
  }
}

export function deactivate() {}
