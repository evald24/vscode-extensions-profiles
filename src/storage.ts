import { open } from "sqlite";
import * as sqlite3 from "sqlite3";
import * as vscode from "vscode";
import { ExtensionValue, StorageValue } from "./types";
import { getGlobalStorage } from "./utils";


export async function getDisabledExtensionsInStorage() {
  let pathDB = getGlobalStorage() + "/state.vscdb";

  const db = await open({
    filename: pathDB,
    driver: sqlite3.Database,
  });

  let data = (await db.get("SELECT key, value FROM ItemTable WHERE key = ?", "extensionsIdentifiers/disabled")) as StorageValue;
  let value = JSON.parse(data.value) as ExtensionValue[];

  return value;
}

export async function getAllExtensions() {
  const disabled = await getDisabledExtensionsInStorage();
  const enabled = getEnabledExtensions();

  // https://github.com/microsoft/vscode/issues/15466
  // vscode.extensions.getExtension not working disabled extensions
  // for (const item of disabled) {
  //   let ext = vscode.extensions.getExtension(item.id);
  //   item.label = ext?.packageJSON.displayName || item.id;
  // }

  return [...disabled, ...enabled];
}

export function getEnabledExtensions() {

  return vscode.extensions.all
    .filter((e) => /^(?!\/Applications\/Visual Studio Code.app\/).*$/g.test(e.extensionPath))
    .map(item =>({
      id: item.id,
      uuid: item?.packageJSON.uuid,
      label: item?.packageJSON.displayName
    }));
}
