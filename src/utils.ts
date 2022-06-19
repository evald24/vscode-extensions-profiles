import { homedir } from "os";
import { promisify } from "util";
import * as vscode from "vscode";
import { GLOBAL_PROFILE_NAME, PLATFORM_SLASH } from "./constans";
import { getGlobalStateValue, getGlobalStorageValue, setGlobalStateValue } from "./storage";
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
  if (process.platform === "win32") return `${getVSCodePath()}\\User\\workspaceStorage`;
  else return `${getVSCodePath()}/User/workspaceStorage`;
}
// Workspaces
export function getWorkspacesPath(): string {
  if (process.platform === "win32") return `${getVSCodePath()}\\Workspaces`;
  else return `${getVSCodePath()}/Workspaces`;
}

// User global storage
export function getUserGlobalStoragePath(): string {
  if (process.platform === "win32") return `${getVSCodePath()}\\User\\globalStorage`;
  else return `${getVSCodePath()}/User/globalStorage`;
}

export async function getPathUserWorkspaceStorageUUID(uriWorkspace: vscode.Uri): Promise<string> {
  let pathUserWorkspaceStorage = getUserWorkspaceStoragePath();

  const files = await getFiles(pathUserWorkspaceStorage, "workspace.json");
  const fsPath = (await searchFolderUserWorkspaceStorage(files, uriWorkspace))[0]!;
  return fsPath.replace(pathUserWorkspaceStorage + PLATFORM_SLASH, "").replace(PLATFORM_SLASH + "workspace.json", "");
}

export async function getPathWorkspacesUUID(uriWorkspaces: vscode.Uri[]): Promise<string> {
  let pathWorkspaces = getWorkspacesPath();
  let pathUserWorkspaceStorage = getUserWorkspaceStoragePath();

  const filesWorkspaces = await getFiles(pathWorkspaces, "workspace.json");
  const filesUserWorkspaceStorage = await getFiles(pathUserWorkspaceStorage, "workspace.json");
  const fsPath = (await searchWorkspaces([...filesWorkspaces, ...filesUserWorkspaceStorage], uriWorkspaces))[0]!;
  return fsPath.replace(pathUserWorkspaceStorage + PLATFORM_SLASH, "").replace(PLATFORM_SLASH + "workspace.json", "");
}

// Recursive search for files in a directory with pattern
async function getFiles(dir: string, pattern: string): Promise<string[]> {
  const subdirs = await readdir(dir);
  const files = await Promise.all(
    subdirs.map(async (subdir: string) => {
      const res = path.resolve(dir, subdir);
      if ((await stat(res)).isDirectory()) return await getFiles(res, pattern);
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
        if (!fs.existsSync(filePath))
          return undefined;


        let { folder, workspace }: { folder?: string; workspace?: string } = loadJSON(filePath);
        if (process.platform === "win32") {
          if (folder && folder.replace("%3A", ":").toLocaleLowerCase() === fileUrl(uriWorkspace).toLocaleLowerCase()) return filePath;
          if (workspace && workspace.replace("%3A", ":").toLocaleLowerCase() === fileUrl(uriWorkspace).toLocaleLowerCase()) return filePath;
        } else {
          if (folder && folder === fileUrl(uriWorkspace)) return filePath;
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
        if (!fs.existsSync(filePath))
          return undefined;

        let data: { folders?: Array<{ path: string }>; workspace?: string } = loadJSON(filePath);

        if (typeof data.workspace !== "undefined") {
          let fsPathWorkspace = vscode.Uri.parse(path.resolve(data.workspace.replace("file://", ""))).fsPath;

          if (process.platform === "win32") fsPathWorkspace = fsPathWorkspace.slice(1, fsPathWorkspace.length);
          if (!fs.existsSync(fsPathWorkspace)) return undefined;

          data = loadJSON(fsPathWorkspace);
          for (const item of data.folders!)
            item.path = path.join(path.dirname(fsPathWorkspace), item.path);

        }

        if (typeof data.folders !== "undefined") {
          let i = 0;
          for (const { path: relativePath } of data.folders) {
            const fsPath = path.resolve(relativePath);
            if (folders.includes(process.platform === "win32" ? fsPath.toLocaleLowerCase() : fsPath))
              i++;
          }
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

function sortObjectByKey(obj: any) {
  return Object.keys(obj).sort().reduce(
    (result: any, key) => {
      result[key] = obj[key];
      return result;
    }, {}
  );
}

export async function getProfiles(ctx: vscode.ExtensionContext) {
  let data = await getGlobalStateValue(ctx, "profiles");

  // copy old state
  if (Object.keys(data).length === 0) {
    data = await getGlobalStorageValue("vscodeExtensionProfiles/profiles");
    await setGlobalStateValue(ctx, "profiles", data);
  }

  return sortObjectByKey(data) as ProfileList;
}

export async function getExtensions(ctx: vscode.ExtensionContext) {
  return (await getGlobalStateValue(ctx, "extensions")) as ExtensionList;
}

export function loadJSON(path: string) {
  return JSON.parse(fs.readFileSync(path) as any);
}

export async function getAllExtensions() {
  const extPath = getExtensionsPath();
  let extensions: ExtensionValue[] = [];
  let obsolete: string[] = []; // default value

  if (fs.existsSync(extPath + ".obsolete"))
    obsolete = Object.keys(loadJSON(extPath + ".obsolete"));

  let all = await readdir(extPath);

  await Promise.all(
    all.map(async (name) => {
      if ((await stat(extPath + name)).isDirectory() && !obsolete.includes(name)) {
        const packageJsonPath = extPath + name + PLATFORM_SLASH + "package.json";
        try {
          let info: PackageJson = require(packageJsonPath);

          let extInfo = {
            id: `${info.publisher.toLowerCase()}.${info.name.toLowerCase()}`,
            uuid: info.__metadata?.id,
            label: info.displayName || info.name,
            description: info.description,
          };

          if (/^%.*%$/igm.test(extInfo.label))
            extInfo.label = getExtensionLocaleValue(extPath + name + PLATFORM_SLASH, extInfo.label);

          if (/^%.*%$/igm.test(extInfo.description))
            extInfo.description = getExtensionLocaleValue(extPath + name + PLATFORM_SLASH, extInfo.description);

          extensions.push(extInfo);
        } catch (e) {
          // vscode.window.showWarningMessage(`Could not get information from "${packageJsonPath}"`);
          console.warn(e);
        }
      }
    }),
  );

  return extensions.sort((a: any, b: any) => {
    if (a.label > b.label) return -1;
    else if (a.label < b.label) return 1;
    else return 0;
  });
}

export function getExtensionLocaleValue(extPath: string, key: string): string {
  const language = vscode.env.language;

  const defaultPath = `${extPath}${PLATFORM_SLASH}package.nls.json`;
  const languagePath = `${extPath}${PLATFORM_SLASH}package.nls.${language}.json`;

  if (fs.existsSync(languagePath))
    return require(languagePath)[key.replace(/%/g, "")];

  try {
    return require(defaultPath)[key.replace(/%/g, "")];
  } catch (e) {
    console.warn(`Not found translate file "${defaultPath}" for key "${key}"`);
  }

  return key;
}

/**
 *  Return a path to a profile export file that will be in a 'Documents' folder or just the 'Documents'.
 */
export function getPathToDocuments(profileName?: string): vscode.Uri {
  let documentsPath = `${homedir()}${PLATFORM_SLASH}Documents${PLATFORM_SLASH}`;
  // Return the URI either with a file name appended (export) or without it (import)
  return vscode.Uri.file(profileName ? `${documentsPath}${profileName}.json` : documentsPath);
}

/**
 *  Check if a global profile exists. It will create one if there isn't any.
 */
export async function checkGlobalProfile(ctx: vscode.ExtensionContext) {
  const profiles = await getProfiles(ctx);
  if (profiles[GLOBAL_PROFILE_NAME] === undefined)
    profiles[GLOBAL_PROFILE_NAME] = {};

  await setGlobalStateValue(ctx,"profiles", profiles);
}

export const environment = {
  GLOBAL_STORAGE_PATH: "",
  WORKSPACE_STORAGE_PATH: "",
  WORKSPACE_STORAGE_UUID: "",
  WORKSPACE_STORAGE_PATH_UUID: "",
}

// Set environments from context
export async function setEnv(ctx: vscode.ExtensionContext) {
  // Set global storage path
  environment.GLOBAL_STORAGE_PATH = path.join(ctx.globalStorageUri.path, "../").replace(/^\\/, "");

  // Set workspace storage path
  if (ctx.storageUri) environment.WORKSPACE_STORAGE_PATH = path.join(ctx.storageUri.path, "../../").replace(/^\\/, "");

  // Set workspace storage UUID
  let folders = vscode.workspace.workspaceFolders;
  if (folders !== undefined) {
    if (folders.length > 1) {
      let uriFolders: vscode.Uri[] = [];
      for (const folder of folders) uriFolders.push(folder.uri);
      environment.WORKSPACE_STORAGE_UUID = await getPathWorkspacesUUID(uriFolders);
    } else environment.WORKSPACE_STORAGE_UUID = await getPathUserWorkspaceStorageUUID(folders[0].uri);
  }
  environment.WORKSPACE_STORAGE_PATH_UUID = `${environment.WORKSPACE_STORAGE_PATH}${PLATFORM_SLASH}${environment.WORKSPACE_STORAGE_UUID}${PLATFORM_SLASH}`.replace("//", "/");
}
