import { open } from "sqlite";
import * as sqlite3 from "sqlite3";
import * as vscode from "vscode";
import { ExtensionList, ExtensionValue, ProfileList, StorageKey, StorageKeyID, StorageValue } from "./types";
import { environment } from "./utils";

//
export async function getDisabledExtensionsGlobalStorage() {
  const db = await open({
    filename: `${environment.GLOBAL_STORAGE_PATH}state.vscdb`,
    driver: sqlite3.Database,
  });

  const data = ((await db.get("SELECT key, value FROM ItemTable WHERE key = ?", "extensionsIdentifiers/disabled")) as StorageValue) || undefined;
  await db.close();

  if (data?.value) {
    return JSON.parse(data.value) as ExtensionValue[];
  }
  return []; // default
}

// VSCode hides disabled extensions
// https://github.com/microsoft/vscode/issues/15466
export function getEnabledExtensions() {
  return vscode.extensions.all
    .filter((e) => !/.*(?:\\\\|\/)resources(?:\\\\|\/)app(?:\\\\|\/)extensions(?:\\\\|\/).*/i.test(e.extensionPath)) // ignore internal extensions
    .map(
      (item) =>
        ({
          id: item.id,
          uuid: item?.packageJSON.uuid,
          label: item?.packageJSON.displayName,
          description: item?.packageJSON.description,
        } as ExtensionValue)
    );
}

export async function getWorkspaceStorageValue(key: "enabled" | "disabled") {
  const db = await open({
    filename: `${environment.WORKSPACE_STORAGE_PATH_UUID}state.vscdb`,
    driver: sqlite3.Database,
  });

  let data = (await db.get("SELECT key, value FROM ItemTable WHERE key = ?", `extensionsIdentifiers/${key}`)) as StorageValue;
  await db.close();

  if (data?.value) {
    return JSON.parse(data.value) as ExtensionValue[];
  }
  return []; // default
}

export async function setWorkspaceStorageValue(key: "enabled" | "disabled", extensions: ExtensionValue[]) {
  const db = await open({
    filename: `${environment.WORKSPACE_STORAGE_PATH_UUID}state.vscdb`,
    driver: sqlite3.Database,
  });

  await db.run("INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", `extensionsIdentifiers/${key}`, JSON.stringify(extensions));
  return await db.close();
}

/**
 * @deprecated use getGlobalStateValue
 */
export async function getGlobalStorageValue(key: StorageKey): Promise<ExtensionList | ProfileList> {
  const db = await open({
    filename: `${environment.GLOBAL_STORAGE_PATH}state.vscdb`,
    driver: sqlite3.Database,
  });

  let data = (await db.get("SELECT key, value FROM ItemTable WHERE key = ?", key)) as StorageValue;
  await db.close();

  if (data?.value) {
    return JSON.parse(data.value);
  }
  return {}; // default
}

export async function setGlobalStateValue(ctx: vscode.ExtensionContext, key: StorageKeyID, value: ExtensionList | ProfileList) {
  return await ctx.globalState.update(key, value);
}

export async function getGlobalStateValue(ctx: vscode.ExtensionContext, key: StorageKeyID): Promise<ExtensionList | ProfileList> {
  const data = ctx.globalState.get<ExtensionList | ProfileList>(key);
  if (data !== undefined) {
    return data;
  }
  return {}; // default
}
