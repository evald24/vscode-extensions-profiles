import * as vscode from "vscode";
import { ConfigList, ExtensionList } from "./types";

export const CONFIG_KEY = "vscode-extension-profiles";
export const CONFIG_KEY_LIST = "list";
export const CONFIG_LIST_EXTENSIONS = "extensions";

export function getProfiles(): ConfigList {
  return vscode.workspace.getConfiguration(CONFIG_KEY).get<any>(CONFIG_KEY_LIST);
}

export function getExtensionList(): ExtensionList {
  return vscode.workspace.getConfiguration(CONFIG_KEY).get<any>(CONFIG_LIST_EXTENSIONS);
}

export async function setExtensionList(value: ExtensionList) {
  await vscode.workspace.getConfiguration(CONFIG_KEY).update(CONFIG_LIST_EXTENSIONS, value, vscode.ConfigurationTarget.Global);
}
