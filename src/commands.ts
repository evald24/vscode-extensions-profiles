/* eslint-disable @typescript-eslint/naming-convention */

import * as vscode from "vscode";
import { getAllExtensions, setGlobalStorageValue, setWorkspaceStorageValue } from "./storage";
import { ExtensionList, ExtensionValue } from "./types";
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

// Select and apply profile ...
async function applyProfile() {
  // Checking whether the workspace is open
  let fsPath;
  if (vscode.workspace.workspaceFolders !== undefined) {
    fsPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
  } else {
    vscode.window.showErrorMessage("Working folder not found, open a folder an try again", { modal: true });
    return;
  }

  // Get and check profiles
  const profiles = await getProfileList();
  if (Object.keys(profiles).length === 0) {
    vscode.window.showErrorMessage("No profiles found, please create a profile first.", { modal: true });
    return;
  }

  // Generate items
  let itemsProfiles: vscode.QuickPickItem[] = [];
  for (const item in profiles) {
    itemsProfiles.push({
      label: item,
    });
  }

  // Selected profile
  let profileName = (await vscode.window.showQuickPick(itemsProfiles, { placeHolder: "Search" , title:"Select a profile"}))?.label
  if (!profileName) {
    return;
  }

  // Check and refresh extension list
  let extensions = await getExtensionList();
  console.log(extensions)

  // Update if not exist
  if (Object.keys(extensions).length === 0) {
    extensions = await refreshExtensionList();
  }

  let enabledList: ExtensionValue[] = []
  let disabledList: ExtensionValue[] = []

  for (const key in extensions) {
    let item: ExtensionValue = { id: key, uuid: extensions[key].uuid }

    // Set enabled and disabled extensions for workspace
    if (profiles[profileName][key] !== undefined) {
      enabledList.push(item)
    } else {
      disabledList.push(item)
    }
  }

  let uuid = await getWorkspaceUUID(vscode.Uri.parse(fsPath));

  await setWorkspaceStorageValue(uuid, "enabled", enabledList)
  await setWorkspaceStorageValue(uuid, "disabled", disabledList)

  // Reloading the window to apply extensions
  vscode.commands.executeCommand("workbench.action.reloadWindow");
}

export async function createProfile() {
  const profiles = await getProfileList();

  // set name profile
  let profileName;
  let placeHolder = "Come up with a profile name";
  while (true) {
    profileName = await vscode.window.showInputBox({ placeHolder, title: "Create new profile" });

    if (profileName && Object.keys(profiles).includes(profileName)) {
      placeHolder = `The profile \"${profileName}\" already exists, think of another name`;
      continue; //go next step
    } else if (!profileName) {
      return; // close input box
    }

    break;
  }

  // Get extension list of cache
  let extensions = await getExtensionList();

  // update if not exist
  if (Object.keys(extensions).length === 0) {
    extensions = await refreshExtensionList();
  }

  // create extension list
  let itemsWorkspace: vscode.QuickPickItem[] = [];
  for (const key in extensions) {
    let item = extensions[key];
    itemsWorkspace.push({
      label: item.label || key,
      description: item.label ? key : undefined,
      detail: item.description || " - - - - - ",
    });
  }

  // show and select extensions
  let selected = await vscode.window.showQuickPick(itemsWorkspace, {
    canPickMany: true,
    placeHolder: "The selected extensions will be enabled for the workspace",
    title: `Select extensions for "${profileName}"`,
  });

  // set enabled extensions for profile
  profiles[profileName] = {};

  if (selected) {
    for (const { description: key } of selected) {
      profiles[profileName][key!] = extensions[key!];
    }
  }

  await setGlobalStorageValue("vscodeExtensionProfiles/profiles", profiles);
  vscode.window.showInformationMessage(`Profile "${profileName}" successfully created`);

  return profiles;
}

export async function refreshExtensionList() {
  let oldExtensionList = await getExtensionList();
  let newExtensionList: ExtensionList = {};

  for (const item of await getAllExtensions()) {
    if (!item.label || !item.description) {
      item.label = item.id;
      if (Object.keys(oldExtensionList).length > 0) {
        for (const key in oldExtensionList) {
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
