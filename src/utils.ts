import { promisify } from "util";
import * as vscode from "vscode";
import { getGlobalStorageValue } from "./storage";
import { ExtensionList, ExtensionValue, PackageJson, ProfileList } from "./types";

import path = require("path");
import fs = require("fs");
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const platform_slash = process.platform === "win32" ? "\\" : "/";

// VSCode path in different OS
// https://code.visualstudio.com/docs/setup/setup-overview#_how-can-i-do-a-clean-uninstall-of-vs-code
export function getVSCodePath(): string {
  switch (process.platform) {
    case "win32":
      return `${process.env.APPDATA}\\Code`;
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
      return `${process.env.USERPROFILE}\\.vscode\\extensions\\`;
    case "darwin":
    case "linux":
    default:
      return `${process.env.HOME}/.vscode/extensions/`;
  }
}

// User workspace storage
export function getUserWorkspaceStoragePath(): string {
  // eslint-disable-next-line curly
  if (process.platform === "win32") return `${getVSCodePath()}\\User\\workspaceStorage`;
  // eslint-disable-next-line curly
  else return `${getVSCodePath()}/User/workspaceStorage`;
}
// Workspaces
export function getWorkspacesPath(): string {
  // eslint-disable-next-line curly
  if (process.platform === "win32") return `${getVSCodePath()}\\Workspaces`;
  // eslint-disable-next-line curly
  else return `${getVSCodePath()}/Workspaces`;
}

// User global storage
export function getUserGlobalStoragePath(): string {
  // eslint-disable-next-line curly
  if (process.platform === "win32") return `${getVSCodePath()}\\User\\globalStorage`;
  // eslint-disable-next-line curly
  else return `${getVSCodePath()}/User/globalStorage`;
}

export async function getUserWorkspaceStorageUUID(uriWorkspace: vscode.Uri): Promise<string> {
  let pathUserWorkspaceStorage = getUserWorkspaceStoragePath();

  const files = await getFiles(pathUserWorkspaceStorage, "workspace.json");
  const fsPath = (await searchFolderUserWorkspaceStorage(files, uriWorkspace))[0]!;
  return fsPath.replace(pathUserWorkspaceStorage + platform_slash, "").replace(platform_slash + "workspace.json", "");
}

export async function getWorkspacesUUID(uriWorkspaces: vscode.Uri[]): Promise<string> {
  let pathWorkspaces = getWorkspacesPath();
  let pathUserWorkspaceStorage = getUserWorkspaceStoragePath();

  const filesWorkspaces = await getFiles(pathWorkspaces, "workspace.json");
  const filesUserWorkspaceStorage = await getFiles(pathUserWorkspaceStorage, "workspace.json");
  const fsPath = (await searchWorkspaces([...filesWorkspaces, ...filesUserWorkspaceStorage], uriWorkspaces))[0]!;
  return fsPath.replace(pathUserWorkspaceStorage + platform_slash, "").replace(platform_slash + "workspace.json", "");
}

// Recursive search for files in a directory with pattern
async function getFiles(dir: string, pattern: string): Promise<string[]> {
  const subdirs = await readdir(dir);
  const files = await Promise.all(
    subdirs.map(async (subdir: string) => {
      const res = path.resolve(dir, subdir);
      // eslint-disable-next-line curly
      if ((await stat(res)).isDirectory()) return await getFiles(res, pattern);
      // eslint-disable-next-line curly
      else if (res.substr(-1 * pattern.length) === pattern) return res;
      return undefined;
    }),
  ).then((allData) => allData.filter((x) => x !== undefined));
  return files.reduce((a: any, f: any) => a.concat(f), []) as Promise<string[]>;
}

async function searchFolderUserWorkspaceStorage(files: string[], uriWorkspace: vscode.Uri) {
  return await Promise.all(
    files.map(async (filePath: string) => {
      try {
        if (!fs.existsSync(filePath)) return undefined;

        let { folder, workspace }: { folder?: string; workspace?: string } = loadJSON(filePath);
        if (process.platform === "win32") {
          // eslint-disable-next-line curly
          if (folder && folder.replace("%3A", ":").toLocaleLowerCase() === fileUrl(uriWorkspace).toLocaleLowerCase()) return filePath;
          // eslint-disable-next-line curly
          if (workspace && workspace.replace("%3A", ":").toLocaleLowerCase() === fileUrl(uriWorkspace).toLocaleLowerCase()) return filePath;
        } else {
          // eslint-disable-next-line curly
          if (folder && folder === fileUrl(uriWorkspace)) return filePath;
          // eslint-disable-next-line curly
          if (workspace && workspace === fileUrl(uriWorkspace)) return filePath;
        }
      } catch (e) {
        console.error(e);
      }
      return undefined;
    }),
  ).then((allData) => allData.filter((x) => x !== undefined));
}

async function searchWorkspaces(files: string[], uriFolders: vscode.Uri[]) {
  let folders: string[] = uriFolders.map((item) => (process.platform === "win32" ? item.fsPath.toLocaleLowerCase() : item.fsPath));

  return await Promise.all(
    files.map(async (filePath: string) => {
      try {
        if (!fs.existsSync(filePath)) return undefined;

        let data: { folders?: Array<{ path: string }>; workspace?: string } = loadJSON(filePath);

        if (typeof data.workspace !== "undefined") {
          let fsPathWorkspace = vscode.Uri.parse(path.resolve(data.workspace.replace("file://", ""))).fsPath;

          // eslint-disable-next-line curly
          if (process.platform === "win32") fsPathWorkspace = fsPathWorkspace.slice(1, fsPathWorkspace.length);

          // eslint-disable-next-line curly
          if (!fs.existsSync(fsPathWorkspace)) return undefined;

          data = loadJSON(fsPathWorkspace);
          for (const item of data.folders!)
            item.path = path.join(path.dirname(fsPathWorkspace), item.path);

        }

        if (typeof data.folders !== "undefined") {
          let i = 0;
          for (const { path: relativePath } of data.folders) {
            // eslint-disable-next-line curly
            const fsPath = path.resolve(relativePath);
            if (folders.includes(process.platform === "win32" ? fsPath.toLocaleLowerCase() : fsPath)) i++;
          }
          // eslint-disable-next-line curly
          if (i === folders.length) return filePath;
        }
      } catch (e) {
        console.error(e);
      }
      return undefined;
    }),
  ).then((allData) => allData.filter((x) => x !== undefined));
}

export function fileUrl(filePath: vscode.Uri, options: any = { resolve: true }) {
  let pathName = filePath.fsPath;

  if (options.resolve)
    pathName = path.resolve(filePath.fsPath);


  pathName = pathName.replace(/\\/g, "/");

  // Windows drive letter must be prefixed with a slash.
  if (pathName[0] !== "/")
    pathName = `/${pathName}`;


  // Escape required characters for path components.
  // See: https://tools.ietf.org/html/rfc3986#section-3.3
  return encodeURI(`file://${pathName}`).replace(/[?#]/g, encodeURIComponent);
}

export async function getProfileList() {
  return (await getGlobalStorageValue("vscodeExtensionProfiles/profiles")) as ProfileList;
}

export async function getExtensionList() {
  return (await getGlobalStorageValue("vscodeExtensionProfiles/extensions")) as ExtensionList;
}

export function loadJSON(path: string) {
  return JSON.parse(fs.readFileSync(path) as any);
}

export async function getAllExtensions() {
  const extPath = getExtensionsPath();
  let extensions: ExtensionValue[] = [];
  let obsolete: string[] = []; // default value

  if (fs.existsSync(extPath + ".obsolete")) obsolete = Object.keys(loadJSON(extPath + ".obsolete"));

  let all = await readdir(extPath);

  await Promise.all(
    all.map(async (name) => {
      if ((await stat(extPath + platform_slash + name)).isDirectory() && !obsolete.includes(name)) {
        let info: PackageJson = require(extPath + name + platform_slash + "package.json");
        extensions.push({
          id: `${info.publisher.toLowerCase()}.${info.name.toLowerCase()}`,
          uuid: info.__metadata.id,
          label: info.displayName || info.name,
          description: info.description,
        });
      }
    }),
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
