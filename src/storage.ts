import { open } from "sqlite";
import * as sqlite3 from "sqlite3";
import * as vscode from "vscode";
import { ExtensionList, ExtensionValue, ProfileList, StorageKey, StorageValue } from "./types";
import { getUserGlobalStoragePath, getUserWorkspaceStoragePath } from "./utils";


//
export async function getDisabledExtensionsGlobalStorage() {
  const db = await open({
    filename: getUserGlobalStoragePath() + "/state.vscdb",
    driver: sqlite3.Database,
  });

  let data = (await db.get("SELECT key, value FROM ItemTable WHERE key = ?", "extensionsIdentifiers/disabled"))  as StorageValue || undefined;

  if (data?.value) {
    return JSON.parse(data.value) as ExtensionValue[];
  }

  return []; // default
}

// VSCode hides disabled extensions
// https://github.com/microsoft/vscode/issues/15466
export function getEnabledExtensions() {
  return  vscode.extensions.all
    .filter((e) => /^(?!\/Applications\/Visual Studio Code.app\/).*$/g.test(e.extensionPath))
    .map(item =>({
      id: item.id,
      uuid: item?.packageJSON.uuid,
      label: item?.packageJSON.displayName,
      description: item?.packageJSON.description
    }) as ExtensionValue);
}

export async function getWorkspaceStorageValue(uuid: string, key: "enabled" | "disabled") {
  const db = await open({
    filename: `${getUserWorkspaceStoragePath()}/${uuid}/state.vscdb`,
    driver: sqlite3.Database,
  });

  let data = (await db.get("SELECT key, value FROM ItemTable WHERE key = ?", `extensionsIdentifiers/${key}`)) as StorageValue;

  if (data?.value) {
    return JSON.parse(data.value) as ExtensionValue[];
  }

  return []; // default
}

export async function setWorkspaceStorageValue(uuid: string,  key: "enabled" | "disabled", extensions: ExtensionValue[]) {
  const db = await open({
    filename: `${getUserWorkspaceStoragePath()}/${uuid}/state.vscdb`,
    driver: sqlite3.Database,
  });

  return await db.run("INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", `extensionsIdentifiers/${key}`, JSON.stringify(extensions));
}


export async function setGlobalStorageValue(key: StorageKey, value: ExtensionList | ProfileList) {
  const db = await open({
    filename: getUserGlobalStoragePath() + "/state.vscdb",
    driver: sqlite3.Database,
  });

  return await db.run("INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", key, JSON.stringify(value));
}

export async function getGlobalStorageValue(key: StorageKey) : Promise<ExtensionList | ProfileList>{
  const db = await open({
    filename: getUserGlobalStoragePath() + "/state.vscdb",
    driver: sqlite3.Database,
  });

  let data = (await db.get("SELECT key, value FROM ItemTable WHERE key = ?", key)) as StorageValue;


  if (data?.value) {
    return JSON.parse(data.value);
  }

  return {}; // default
}
