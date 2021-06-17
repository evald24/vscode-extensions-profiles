import { open } from "sqlite";
import * as sqlite3 from "sqlite3";
import * as vscode from "vscode";
import { ExtensionList, ExtensionValue, ProfileList, StorageKey, StorageValue } from "./types";
import { getGlobalStoragePath, getWorkspaceStoragePath } from "./utils";


export async function getDisabledExtensionsInGlobalStorage() {
  const db = await open({
    filename: getGlobalStoragePath() + "/state.vscdb",
    driver: sqlite3.Database,
  });

  let data = (await db.get("SELECT key, value FROM ItemTable WHERE key = ?", "extensionsIdentifiers/disabled"))  as StorageValue || undefined;

  if (data?.value) {
    return JSON.parse(data.value) as ExtensionValue[];
  }

  return []; // default
}

export async function getAllExtensions() {
  const disabled = await getDisabledExtensionsInGlobalStorage();
  const enabled = getEnabledExtensions();

  // https://github.com/microsoft/vscode/issues/15466
  // vscode.extensions.getExtension not working disabled extensions
  // for (const item of disabled) {
  //   let ext = vscode.extensions.getExtension(item.id);
  //   item.label = ext?.packageJSON.displayName || item.id;
  // }

  return [...disabled, ...enabled].sort((a: any, b: any) => {
    // eslint-disable-next-line curly
    if (a.label > b.label)
      return -1;
    // eslint-disable-next-line curly
    else if (a.label < b.label)
      return 1;
    return 0;
  });
}

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
    filename: `${getWorkspaceStoragePath()}/${uuid}/state.vscdb`,
    driver: sqlite3.Database,
  });

  let data = (await db.get("SELECT key, value FROM ItemTable WHERE key = ?", `extensionsIdentifiers/${key}`)) as StorageValue;

  if (data?.value) {
    return JSON.parse(data.value) as ExtensionValue[];
  }

  return []; // default
}

// setDisabledExtensionsInWorkspaceStorage
// setEnabledExtensionsInWorkspaceStorage

// // Проверять отключены ли плагины в GlobalStorage
// // -- если да (есть в списке)
// // Если указано, что нужно включать плагин, то помещать в extensionsIdentifiers/enabled
// // Если указано, нет влючены то помещать в extensionsIdentifiers/disabled

// Все отмеченые плагины помещать в extensionsIdentifiers/enabled
// Все не отмеченые плагины помещать в extensionsIdentifiers/disabled

export async function setWorkspaceStorageValue(uuid: string,  key: "enabled" | "disabled", extensions: ExtensionValue[]) {
  const db = await open({
    filename: `${getWorkspaceStoragePath()}/${uuid}/state.vscdb`,
    driver: sqlite3.Database,
  });

  return await db.run("INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", `extensionsIdentifiers/${key}`, JSON.stringify(extensions));
}


export async function setGlobalStorageValue(key: StorageKey, value: ExtensionList | ProfileList) {
  const db = await open({
    filename: getGlobalStoragePath() + "/state.vscdb",
    driver: sqlite3.Database,
  });

  return await db.run("INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", key, JSON.stringify(value));
}

export async function getGlobalStorageValue(key: StorageKey) : Promise<ExtensionList | ProfileList>{
  const db = await open({
    filename: getGlobalStoragePath() + "/state.vscdb",
    driver: sqlite3.Database,
  });

  let data = (await db.get("SELECT key, value FROM ItemTable WHERE key = ?", key)) as StorageValue;


  if (data?.value) {
    return JSON.parse(data.value);
  }

  return {}; // default
}
