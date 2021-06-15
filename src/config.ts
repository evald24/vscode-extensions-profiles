import * as vscode from "vscode";

export const CONFIG_KEY = "vscode-extension-profiles";
export const CONFIG_KEY_LIST = "list";
export const CONFIG_LIST_EXTENSIONS = "extensions";

type ConfigList = {
  [key: string]: String[];
};

export function getProfiles(): ConfigList[] {
  return vscode.workspace.getConfiguration(CONFIG_KEY).get<any>(CONFIG_KEY_LIST);
}
