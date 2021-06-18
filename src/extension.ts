import * as vscode from "vscode";
import { Commands, CommandTypes, refreshExtensionList } from "./commands";

export async function activate(ctx: vscode.ExtensionContext) {
  // Refreshing the list of extensions after startup
  refreshExtensionList({ isCache: true });

  // Registration commands
  for (const key in Commands) {
    ctx.subscriptions.push(vscode.commands.registerCommand(key, async () => Commands[key as typeof CommandTypes[number]]({ ctx })));
  }
}

export function deactivate() {}
