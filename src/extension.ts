"use strict";
import * as vscode from "vscode";
import { applyProfile, cloneProfile, createProfile, deleteProfile, editProfile, exportProfile, importProfile, refreshExtensionList } from "./commands";
import { createStatusBarItem } from "./status-bar";
import { CommandType } from "./types";
import { checkGlobalProfile, setEnv } from "./utils";

export async function activate(ctx: vscode.ExtensionContext) {
  // Set environments
  await setEnv(ctx);

  // Refreshing the list of extensions after startup
  refreshExtensionList(ctx, { isCache: true });

  // Registration commands
  ctx.subscriptions.push(
    vscode.commands.registerCommand("vscode-extension-profiles.Refresh" as CommandType, () => refreshExtensionList(ctx, {})),
    vscode.commands.registerCommand("vscode-extension-profiles.Create" as CommandType, () => createProfile(ctx)),
    vscode.commands.registerCommand("vscode-extension-profiles.Clone" as CommandType, () => cloneProfile(ctx)),
    vscode.commands.registerCommand("vscode-extension-profiles.Apply" as CommandType, () => applyProfile(ctx)),
    vscode.commands.registerCommand("vscode-extension-profiles.Edit" as CommandType, () => editProfile(ctx)),
    vscode.commands.registerCommand("vscode-extension-profiles.Delete" as CommandType, () => deleteProfile(ctx)),
    vscode.commands.registerCommand("vscode-extension-profiles.Export" as CommandType, () => exportProfile(ctx)),
    vscode.commands.registerCommand("vscode-extension-profiles.Import" as CommandType, () => importProfile(ctx)),
    createStatusBarItem("vscode-extension-profiles.Apply", ctx),
  );

  await checkGlobalProfile(ctx);
}

export function deactivate() {}
