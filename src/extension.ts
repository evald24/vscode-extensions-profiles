"use strict";
import * as vscode from "vscode";
import { applyProfile, createProfile, deleteProfile, editProfile, exportProfile, importProfile, refreshExtensionList, updateGlobalProfile } from "./commands";
import { CommandType } from "./types";

export async function activate(ctx: vscode.ExtensionContext) {
  // Refreshing the list of extensions after startup
  refreshExtensionList({ isCache: true });

  // Registration commands
  ctx.subscriptions.push(
    vscode.commands.registerCommand("vscode-extension-profiles.Refresh" as CommandType, () => refreshExtensionList({})),
    vscode.commands.registerCommand("vscode-extension-profiles.Create" as CommandType, createProfile),
    vscode.commands.registerCommand("vscode-extension-profiles.Apply" as CommandType, applyProfile),
    vscode.commands.registerCommand("vscode-extension-profiles.Edit" as CommandType, editProfile),
    vscode.commands.registerCommand("vscode-extension-profiles.Delete" as CommandType, deleteProfile),
    vscode.commands.registerCommand("vscode-extension-profiles.Export" as CommandType, exportProfile),
    vscode.commands.registerCommand("vscode-extension-profiles.Import" as CommandType, importProfile),
    vscode.commands.registerCommand("vscode-extension-profiles.UpdateGlobal" as CommandType, updateGlobalProfile),
  );
}

export function deactivate() { }
