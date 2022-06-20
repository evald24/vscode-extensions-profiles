"use strict";
import * as vscode from "vscode";
import { CommandType } from "./types";

let statusBarItem: vscode.StatusBarItem;

export function createStatusBarItem(comandID: CommandType, ctx: vscode.ExtensionContext): vscode.StatusBarItem {
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.name = "Extension Profiles";
  statusBarItem.command = comandID;
  statusBarItem.tooltip = "Select and apply profile";

  let profileName = ctx.workspaceState.get<string>("profile");
  if (!!profileName) {
    statusBarItem.text = `$(extensions) ${profileName}`;
  } else {
    statusBarItem.text = "$(extensions) Select a profile";
  }

  statusBarItem.show();
  return statusBarItem;
}

export function getStatusBar(): vscode.StatusBarItem {
  return statusBarItem;
}
