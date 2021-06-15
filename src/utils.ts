import * as vscode from "vscode";

export function getAllExtensions() {
  return vscode.extensions.all.filter((e) => /^(?!\/Applications\/Visual Studio Code.app\/).*$/g.test(e.extensionPath));
}
