import { promisify } from "util";
import * as vscode from "vscode";
import { getGlobalStorageValue } from "./storage";
import { ExtensionList, ProfileList } from "./types";

import path = require("path");
import fs = require("fs");
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// VSCode path in different OS
// https://code.visualstudio.com/docs/setup/setup-overview#_how-can-i-do-a-clean-uninstall-of-vs-code
export function getVSCodePath(): string {
  switch (process.platform) {
    case "win32":
      return `${process.env.APPDATA}/Code`;
    case "darwin":
      return `${process.env.HOME}/Library/Application Support/Code`;
    case "linux":
    default:
      return `${process.env.HOME}/.config/Code`;
  }
}

// Extension path in different OS
// https://vscode-docs.readthedocs.io/en/stable/extensions/install-extension/#your-extensions-folder
export function getExtensionsPath(): string {
  switch (process.platform) {
    case "win32":
      return `${process.env.USERPROFILE}/.vscode/extensions/`;
    case "darwin":
    case "linux":
    default:
      return `${process.env.HOME}/.vscode/extensions/`;
  }
}

// Workspace storage
export function getWorkspaceStoragePath(): string {
  return `${getVSCodePath()}/User/workspaceStorage`;
}

// Global storage
export function getGlobalStoragePath(): string {
  return `${getVSCodePath()}/User/globalStorage`;
}

// extensionsIdentifiers/disabled
// [
//   {
//   "id": "vinicioslc.adb-interface-vscode", "uuid": "3168cc76-e4fd-41e5-b405-277c5fc7dafa"
//   },
//   {
//     "id": "aaron-bond.better-comments", "uuid": "7a0110bb-231a-4598-aa1b-0769ea46d28b"
//   }
// ];

export async function getWorkspaceUUID(uriWorkspace: vscode.Uri): Promise<string> {
  let pathWorkspaceStorage = getWorkspaceStoragePath();
  const files = await getFiles(pathWorkspaceStorage, "workspace.json");
  const uuid = (await searchFolderWorkspace(files, uriWorkspace))[0]?.replace(pathWorkspaceStorage + "/", "").replace("/workspace.json", "");
  return uuid!;
}

// Recursive search for files in a directory with pattern
async function getFiles(dir: string, pattern: string): Promise<string[]> {
  const subdirs = await readdir(dir);
  const files = await Promise.all(
    subdirs.map(async (subdir: string) => {
      const res = path.resolve(dir, subdir);
      if ((await stat(res)).isDirectory()) {
        return getFiles(res, pattern);
      } else if (res.substr(-1 * pattern.length) === pattern) {
        return res;
      }
    }),
  ).then((allData) => allData.filter((x) => x !== undefined));
  return files.reduce((a: any, f: any) => a.concat(f), []) as Promise<string[]>;
}

async function searchFolderWorkspace(files: string[], uriWorkspace: vscode.Uri) {
  return await Promise.all(
    files.map(async (filePath) => {
      const data: { folder: string } = require(filePath);
      console.log({ data, uriWorkspace });
      if (data.folder === fileUrl(uriWorkspace.path)) {
        return filePath;
      }
    }),
  ).then((allData) => allData.filter((x) => x !== undefined));
}

export  function fileUrl(filePath: string, options: any = { resolve: true }) {
  if (typeof filePath !== "string") {
    throw new TypeError(`Expected a string, got ${typeof filePath}`);
  }

  let pathName = filePath;
  if (options.resolve) {
    pathName = path.resolve(filePath);
  }

  pathName = pathName.replace(/\\/g, "/");

  // Windows drive letter must be prefixed with a slash.
  if (pathName[0] !== "/") {
    pathName = `/${pathName}`;
  }

  // Escape required characters for path components.
  // See: https://tools.ietf.org/html/rfc3986#section-3.3
  return encodeURI(`file://${pathName}`).replace(/[?#]/g, encodeURIComponent);
}

export async function getProfileList() {
  return await getGlobalStorageValue("vscodeExtensionProfiles/profile") as ProfileList;
}

export async function getExtensionList() {
  return await getGlobalStorageValue("vscodeExtensionProfiles/profile") as ExtensionList;
}