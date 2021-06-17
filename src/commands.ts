/* eslint-disable @typescript-eslint/naming-convention */

import * as vscode from "vscode";
import { getAllExtensions, setGlobalStorageValue } from "./storage";
import { ExtensionList } from "./types";
import { getExtensionList, getProfileList, getWorkspaceUUID } from "./utils";
export const CommandTypes = [
  "vscode-extension-profiles.Refresh",
  "vscode-extension-profiles.Create",
  "vscode-extension-profiles.Edite",
  "vscode-extension-profiles.Apply",
  "vscode-extension-profiles.Delete",
] as const;

type Args = { ctx: vscode.ExtensionContext };

export const Commands: Record<typeof CommandTypes[number], (args: Args) => any> = {
  "vscode-extension-profiles.Refresh": refreshExtensionList,
  "vscode-extension-profiles.Create": createProfile,
  "vscode-extension-profiles.Edite": editeProfile,
  "vscode-extension-profiles.Apply": applyProfile,
  "vscode-extension-profiles.Delete": deleteProfile,
};

// Select profile ...
async function applyProfile() {
  const profiles = await getProfileList();
  const profilesKeys = Object.keys(profiles);
  if (profilesKeys.length <= 0) {
    vscode.window.showErrorMessage("No profiles found, please create a profile first.", { modal: true });
    return;
  }

  let fsPath;
  if (vscode.workspace.workspaceFolders !== undefined) {
    fsPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
  } else {
    vscode.window.showErrorMessage("Working folder not found, open a folder an try again", { modal: true });
    return;
  }

  let itemsProfiles: vscode.QuickPickItem[] = [];

  for (const item of profilesKeys) {
    itemsProfiles.push({
      label: item,
    });
  }

  let profile = "";
  vscode.window.showQuickPick(itemsProfiles, { placeHolder: "Select profile" }).then((selection) => {
    // the user canceled the selection
    if (!selection) {
      return;
    }
    profile = selection.label;
  });

  console.log(profile);

  let itemsWorkspace: vscode.QuickPickItem[] = [];

  let uuid = await getWorkspaceUUID(vscode.Uri.parse(fsPath));
}

export async function createProfile() {
  const profiles = getProfileList(),
    profilesKeys = Object.keys(profiles);

  // set name profile
  let profileName;
  let placeHolder = "Come up with a profile name";
  while (true) {
    profileName = await vscode.window.showInputBox({ placeHolder });

    if (profileName && profilesKeys.includes(profileName)) {
      placeHolder = `The profile \"${profileName}\" already exists, think of another name`;
      continue; //go next step
    } else if (!profileName) {
      return; // close input box
    }

    break;
  }

  // check and refresh extension list
  let extInCache = await getExtensionList(),
    extKeys = Object.keys(extInCache);

  // update if not exist
  if (extKeys.length === 0) {
    extInCache = await refreshExtensionList();
    extKeys = Object.keys(extInCache);
  }

  // create extension list
  let itemsWorkspace: vscode.QuickPickItem[] = [];
  for (const key of extKeys) {
    let item = extInCache[key];
    itemsWorkspace.push({
      label: item.label || key,
      description: item.label ? key : undefined,
      detail: item.description || " - - - - - ",
    });
  }

  // show and select extensions
  let selected = await vscode.window.showQuickPick(itemsWorkspace, {
    canPickMany: true,
    placeHolder: "The selected extensions will be enabled for the workspace, while others will be disabled.",
  });

  console.log(selected);
}

export async function refreshExtensionList() {
  let oldExtensionList = await getExtensionList(),
    keys = Object.keys(oldExtensionList);
  let newExtensionList: ExtensionList = {};

  for (const item of await getAllExtensions()) {
    if (!item.label || !item.description) {
      item.label = item.id;
      if (keys.length > 0) {
        for (const key of keys) {
          if (item.id === key) {
            if (item.label === key) {
              if (oldExtensionList[key].label) {
                item.label = oldExtensionList[key].label;
              }
            }
            if (oldExtensionList[key].description) {
              item.description = oldExtensionList[key].description;
            }
            break;
          }
        }
      }
    }

    newExtensionList[item.id] = {
      uuid: item.uuid,
      label: item.label,
      description: item.description,
    };
  }

  await setGlobalStorageValue("vscodeExtensionProfiles/extensions", newExtensionList);

  vscode.window.showInformationMessage("Updated the list of installed extensions");
  return newExtensionList;
}

// Edite profile ...
async function editeProfile({ ctx }: Args) {
  console.log(ctx);
  vscode.window.showInformationMessage("editeProfile");
}

// Delete profile ...
async function deleteProfile({ ctx }: Args) {
  console.log(ctx);
  vscode.window.showInformationMessage("deleteProfile");
}

async function ReloadWindow() {
  vscode.commands.executeCommand("workbench.action.reloadWindow");
}
