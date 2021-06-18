import { promisify } from "util";
import * as vscode from "vscode";
import { getGlobalStorageValue } from "./storage";
import { ExtensionList, ExtensionValue, PackageJson, ProfileList } from "./types";

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

// User workspace storage
export function getUserWorkspaceStoragePath(): string {
  return `${getVSCodePath()}/User/workspaceStorage`;
}
// Workspaces
export function getWorkspacesPath(): string {
  return `${getVSCodePath()}/Workspaces`;
}

// User global storage
export function getUserGlobalStoragePath(): string {
  return `${getVSCodePath()}/User/globalStorage`;
}

export async function getUserWorkspaceStorageUUID(uriWorkspace: vscode.Uri): Promise<string> {
  let pathUserWorkspaceStorage = getUserWorkspaceStoragePath();

  const files = await getFiles(pathUserWorkspaceStorage, "workspace.json");
  const uuid = (await searchFolderUserWorkspaceStorage(files, uriWorkspace))[0]?.replace(pathUserWorkspaceStorage + "/", "").replace("/workspace.json", "");

  return uuid!;
}

export async function getWorkspacesUUID(uriWorkspaces: vscode.Uri[]): Promise<string> {
  let pathWorkspaces = getWorkspacesPath();
  let pathUserWorkspaceStorage = getUserWorkspaceStoragePath();

  const filesWorkspaces = await getFiles(pathWorkspaces, "workspace.json");
  const absoluePath = vscode.Uri.parse((await searchFolderWorkspaces(filesWorkspaces, uriWorkspaces))[0]!);

  const filesUserWorkspaceStorage = await getFiles(pathUserWorkspaceStorage, "workspace.json");
  const uuid = (await searchFolderUserWorkspaceStorage(filesUserWorkspaceStorage, absoluePath))[0]?.replace(pathUserWorkspaceStorage + "/", "").replace("/workspace.json", "");

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

async function searchFolderUserWorkspaceStorage(files: string[], uriWorkspace: vscode.Uri) {
  return await Promise.all(
    files.map(async (filePath) => {
      const {folder, workspace}: { folder?: string, workspace?: string } = require(filePath);
      // eslint-disable-next-line curly
      if (folder && folder === fileUrl(uriWorkspace.path)) return filePath;
      // eslint-disable-next-line curly
      if (workspace && workspace === fileUrl(uriWorkspace.path)) return filePath;
    }),
  ).then((allData) => allData.filter((x) => x !== undefined));
}

async function searchFolderWorkspaces(files: string[], uriFolders: vscode.Uri[]) {
  let folders: string[] = uriFolders.map((item => item.fsPath));

  return await Promise.all(
    files.map(async (filePath) => {
      const data: { folders: Array<{ path: string}> } = require(filePath);
      let i = 0;
      // eslint-disable-next-line curly
      for (const { path: fsPath } of data.folders) if (folders.includes(fsPath)) i++;
      // eslint-disable-next-line curly
      if (i === folders.length) return filePath;
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
  return await getGlobalStorageValue("vscodeExtensionProfiles/profiles") as ProfileList;
}

export async function getExtensionList() {
  return await getGlobalStorageValue("vscodeExtensionProfiles/extensions") as ExtensionList;
}

export function loadJSON(path: string) {
  return JSON.parse(fs.readFileSync(path) as any);
}

export async function getAllExtensions() {
  const extPath = getExtensionsPath();
  let extensions: ExtensionValue[] = [];
  let obsolete = Object.keys(loadJSON(extPath + "/.obsolete" ));
  console.log(obsolete);

  let all = await readdir(extPath);

  await Promise.all(
    all.map(async (name) => {
      if ((await stat(extPath + "/" + name)).isDirectory() && !obsolete.includes(name)) {
        let info: PackageJson = require(extPath + "/" + name + "/package.json");
        extensions.push({
          id: `${info.publisher.toLowerCase()}.${info.name.toLowerCase()}`,
          uuid: info.__metadata.id,
          label: info.displayName || info.name,
          description: info.description
        });
      }
    })
  );

  return extensions.sort((a: any, b: any) => {
    // eslint-disable-next-line curly
    if (a.label > b.label) return -1;
    // eslint-disable-next-line curly
    else if (a.label < b.label) return 1;
    // eslint-disable-next-line curly
    else return 0;
  });
}