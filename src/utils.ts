import * as vscode from "vscode";

export function getAllExtensions() {
  return vscode.extensions.all.filter((e) => /^(?!\/Applications\/Visual Studio Code.app\/).*$/g.test(e.extensionPath));
}

// VSCode path in different OS
// https://code.visualstudio.com/docs/setup/setup-overview#_how-can-i-do-a-clean-uninstall-of-vs-code
export function getVSCodePath(): String {
  switch (process.platform) {
    case "win32":
      return `${process.env.APPDATA}/Code/`;
    case "darwin":
      return `${process.env.HOME}/Library/Application Support/Code/`;
    case "linux":
    default:
      return `${process.env.HOME}/.config/Code/`;
  }
}

// Extension path in different OS
// https://vscode-docs.readthedocs.io/en/stable/extensions/install-extension/#your-extensions-folder
export function getExtensionsPath(): String {
  switch (process.platform) {
    case "win32":
      return `${process.env.USERPROFILE}/.vscode/extensions/`;
    case "darwin":
    case "linux":
    default:
      return `${process.env.HOME}/.vscode/extensions/`;
  }
}
