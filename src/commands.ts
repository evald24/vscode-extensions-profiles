import { readFile, writeFile } from "fs/promises";
import * as vscode from "vscode";
import { GLOBAL_PROFILE_NAME } from "./constans";
import { getStatusBar } from "./status-bar";
import { setGlobalStateValue, setWorkspaceStorageValue } from "./storage";
import { ExtensionList, ExtensionValue, ProfileList } from "./types";
import { getAllExtensions, getExtensions, getPathToDocuments, getProfiles } from "./utils";


// Select and apply profile ...
export async function applyProfile(ctx: vscode.ExtensionContext) {
  // Checking whether the workspace is open
  let folders = vscode.workspace.workspaceFolders;
  if (folders === undefined)
    return vscode.window.showErrorMessage("Working folder not found, open a folder an try again.");

  // Get and check profiles
  const profiles = await getProfiles(ctx);
  if (Object.keys(profiles).length === 0)
    return vscode.window.showErrorMessage("No profiles found, please create a profile first.");

  // Generate items
  let itemsProfiles: vscode.QuickPickItem[] = [];
  for (const item in profiles)
    if (item !== GLOBAL_PROFILE_NAME)
      itemsProfiles.push({
        label: item,
      });

  // Selected profile
  let profileName = (await vscode.window.showQuickPick(itemsProfiles, { placeHolder: "Search", title: "Select a profile" }))?.label;
  if (!profileName)
    return;

  // Check and refresh extension list
  let extensions = await getExtensions(ctx);
  if (Object.keys(extensions).length === 0)
    extensions = await refreshExtensionList(ctx, { isCache: true });

  let enabledList: ExtensionValue[] = [];
  let disabledList: ExtensionValue[] = [];

  for (const key in extensions) {
    let item: ExtensionValue = { id: key, uuid: extensions[key].uuid };

    // Set enabled and disabled extensions for workspace
    if (profiles[profileName][key] !== undefined || (profiles[GLOBAL_PROFILE_NAME] && profiles[GLOBAL_PROFILE_NAME][key] !== undefined))
      enabledList.push(item);
    else
      disabledList.push(item);
  }

  // Saving extensions for the workspace
  await setWorkspaceStorageValue("enabled", enabledList);
  await setWorkspaceStorageValue("disabled", disabledList);

  // Set the current profile name
  await ctx.workspaceState.update("profile", profileName)

  try {
    // Old versions re-read active and disabled extensions when the window is restarted
    const [major, minor] = vscode.version.split(".")
    if (major === "1" && Number(minor) < 64) {
      await vscode.commands.executeCommand("workbench.action.reloadWindow");
      return
    }
  } catch (e) { }

  // Set a text status bar
  getStatusBar().text = `$(extensions) Please restart VSCode`

  // Show information about mandatory restart
  if (!ctx.globalState.get<boolean>("isHideMessageRestart")) {
    const result = await vscode.window.showWarningMessage(
      "With the recent update of VSCode, the process of restarting extensions based on the workspace has changed and now requires a full restart of VSCode. Now I'm thinking about how it would be possible to apply the profile without a full reboot, if you know or have suggestions on how to improve the behavior of the extension, please create an issue",
      "Don't show again",
      "More",
    )
    if (result === "More") {
      vscode.env.openExternal(vscode.Uri.parse("https://github.com/microsoft/vscode/issues/151985#issuecomment-1154699511"))
    } else if (result === "Don't show again") {
      ctx.globalState.update("isHideMessageRestart", true);
    }
  } else {
    await vscode.window.showInformationMessage("Please restart VSCode")
  }

  return;
}

async function getNewProfileName(profiles: ProfileList) {
  let profileName;

  let placeHolder = "Come up with a profile name";
  while (true) {
    profileName = await vscode.window.showInputBox({ placeHolder, title: "Create new profile" });

    if (profileName && Object.keys(profiles).includes(profileName)) {
      placeHolder = `The profile \"${profileName}\" already exists, think of another name`;
      continue; // go next step
    } else if (profileName && profileName === GLOBAL_PROFILE_NAME)
      placeHolder = 'This profile name is reserved, please use another one';
    else if (!profileName)
      return null;

    break;
  }

  return profileName;
}

// Create profile ...
export async function createProfile(ctx: vscode.ExtensionContext) {
  const profiles = await getProfiles(ctx);

  const profileName = await getNewProfileName(profiles);
  if (profileName === null)
    return vscode.window.showInformationMessage(`Creation canceled, you did not specify the profile name!`);


  // Get extension list of cache
  let extensions = await getExtensions(ctx);

  // update if not exist
  if (Object.keys(extensions).length === 0)
    extensions = await refreshExtensionList(ctx, { isCache: true });

  // create extension list
  let itemsWorkspace: vscode.QuickPickItem[] = [];
  for (const key in extensions)
    itemsWorkspace.push({
      label: extensions[key].label || key,
      description: extensions[key].label ? key : undefined,
      detail: extensions[key].description || " - - - - - ",
    });


  // show and select extensions
  let selected = await vscode.window.showQuickPick(itemsWorkspace, {
    canPickMany: true,
    placeHolder: "The selected extensions will be enabled for the workspace",
    title: `Select extensions for "${profileName}"`,
  });

  // set enabled extensions for profile
  profiles[profileName] = {};

  if (selected)
    for (const { description: key } of selected)
      profiles[profileName][key!] = extensions[key!];

  await setGlobalStateValue(ctx, "profiles", profiles);

  return vscode.window.showInformationMessage(`Profile "${profileName}" successfully created!`);
}

// Clone profile ...
export async function cloneProfile(ctx: vscode.ExtensionContext) {
  const profiles = await getProfiles(ctx);

  const selectedProfile = await vscode.window.showQuickPick(Object.keys(profiles));
  if (!selectedProfile)
    return vscode.window.showInformationMessage(`Cloning has been canceled, you have not selected a profile!`);


  const profileName = await getNewProfileName(profiles);
  if (profileName === null)
    return vscode.window.showInformationMessage(`Cloning canceled, you did not specify the profile name!`);


  // Get extension list of cache
  let extensions = await getExtensions(ctx);
  // Get ExtensionsList from selected profile to use as prefilled selections
  const preloadedExtensions = profiles[selectedProfile];

  // update if not exist
  if (Object.keys(extensions).length === 0)
    extensions = await refreshExtensionList(ctx, { isCache: true });

  // create extension list
  let itemsWorkspace: vscode.QuickPickItem[] = [];
  for (const key in extensions)
    itemsWorkspace.push({
      picked: !!preloadedExtensions[key],
      label: extensions[key].label || key,
      description: extensions[key].label ? key : undefined,
      detail: extensions[key].description || " - - - - - ",
    });

  // show and select extensions
  let selected = await vscode.window.showQuickPick(itemsWorkspace, {
    canPickMany: true,
    placeHolder: "The selected extensions will be enabled for the workspace",
    title: `Select extensions for "${profileName}"`,
  });


  // set enabled extensions for profile
  profiles[profileName] = {};

  if (selected)
    for (const { description: key } of selected)
      profiles[profileName][key!] = extensions[key!];

  await setGlobalStateValue(ctx, "profiles", profiles);

  return vscode.window.showInformationMessage(`Profile "${profileName}" successfully created!`);
}

// Edit profile ...
export async function editProfile(ctx: vscode.ExtensionContext) {
  // Get and check profiles
  const profiles = await getProfiles(ctx);
  if (Object.keys(profiles).length === 0) {
    createProfile(ctx);
    return vscode.window.showErrorMessage("No profiles found, please create a profile first.");
  }

  // Generate items
  let itemsProfiles: vscode.QuickPickItem[] = [];
  for (const item in profiles)
    itemsProfiles.push({
      label: item
    });

  // Selected profile
  let profileName = (await vscode.window.showQuickPick(itemsProfiles, { placeHolder: "Search", title: "Select a profile to edit" }))?.label;
  if (!profileName)
    return;

  // Check and refresh extension list
  let extensions = await getExtensions(ctx);
  if (Object.keys(extensions).length === 0)
    extensions = await refreshExtensionList(ctx, { isCache: true });

  // add exists (maybe disabled extension)
  for (const key in profiles[profileName])
    extensions[key] = profiles[profileName][key];

  // create extension list
  let itemsWorkspace: vscode.QuickPickItem[] = [];
  for (const key in extensions) {
    let item = extensions[key];
    itemsWorkspace.push({
      label: item.label || key,
      description: item.label ? key : undefined,
      detail: item.description || " - - - - - ",
      picked: profiles[profileName][key] !== undefined
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

  if (selected)
    for (const { description: key } of selected)
      profiles[profileName][key!] = extensions[key!];
  else
    return; // canceled

  await setGlobalStateValue(ctx, "profiles", profiles);
  return vscode.window.showInformationMessage(`Profile "${profileName}" successfully updated!`);
}

// Delete profile ...
export async function deleteProfile(ctx: vscode.ExtensionContext) {
  // Get all profiles
  const profiles = await getProfiles(ctx);
  if (Object.keys(profiles).length === 0)
    return vscode.window.showInformationMessage("All right, no profiles to delete! 😌");

  // Generate items
  let itemsProfiles: vscode.QuickPickItem[] = [];
  for (const item in profiles)
    if (item !== GLOBAL_PROFILE_NAME)
      itemsProfiles.push({
        label: item,
      });

  // Selected profile
  let selectedItems = (await vscode.window.showQuickPick(itemsProfiles, { placeHolder: "Search", title: "Select a profile to delete", canPickMany: true }));
  if (selectedItems === undefined || selectedItems.length === 0)
    return;

  let deletedProfiles = [];
  for (const { label } of selectedItems) {
    delete profiles[label];
    deletedProfiles.push(label);
  }

  await setGlobalStateValue(ctx, "profiles", profiles);
  return vscode.window.showInformationMessage(`Profile${deletedProfiles.length > 1 ? "s" : ""} "${deletedProfiles.join(", ")}" successfully deleted!`);
}

// Export a profile...
export async function exportProfile(ctx: vscode.ExtensionContext) {
  // Get all profiles
  const profiles = await getProfiles(ctx);
  if (Object.keys(profiles).length === 0)
    return vscode.window.showInformationMessage("All right, no profiles to export! 😌");

  // Generate items
  let itemsProfiles: vscode.QuickPickItem[] = [];
  for (const item in profiles)
    itemsProfiles.push({
      label: item
    });

  // Selected profile
  let profileName = (await vscode.window.showQuickPick(itemsProfiles, { placeHolder: "Search", title: "Select a profile to export" }))?.label;
  if (!profileName)
    return;

  const resource = await vscode.window.showSaveDialog({
    title: 'Select a place and file name to save the exported profile',
    saveLabel: 'Export',
    defaultUri: getPathToDocuments(profileName) // Desided to export all extentions to a default 'Documents' folder
  });
  if (!resource)
    return vscode.window.showErrorMessage(`Couldn't locate the path to exported profile! Try again`);
  await writeFile(resource.fsPath, JSON.stringify(profiles[profileName], null, '    '));
  return vscode.window.showInformationMessage(`Profile "${profileName}" successfully exported!`);
}

// Import a profile...
export async function importProfile(ctx: vscode.ExtensionContext) {
  // Use showSaveDialog to get a path to the profile
  const resource = await vscode.window.showOpenDialog({
    title: 'Select a profile to import',
    openLabel: 'Import',
    canSelectMany: false,
    filters: {
      'JSON files': ['json']
    },
    defaultUri: getPathToDocuments()
  });

  if (!resource)
    return vscode.window.showErrorMessage(`Couldn't locate the path to the exported profile! Try again.`);
  const profileName = resource[0].path.split('/').pop()?.slice(0, -5);
  if (!profileName)
    return vscode.window.showErrorMessage(`Couldn't resolve the name of the profile! Rename it and try again.`);

  // Get extension list of cache
  let extensions = await getExtensions(ctx);

  // update if not exist
  if (Object.keys(extensions).length === 0)
    extensions = await refreshExtensionList(ctx, { isCache: true });

  const profiles = await getProfiles(ctx);

  // Add the imported profile
  profiles[profileName] = JSON.parse((await readFile(resource[0].fsPath)).toString());

  await setGlobalStateValue(ctx, "profiles", profiles);

  return vscode.window.showInformationMessage(`Profile "${profileName}" successfully imported!`);
}

export async function refreshExtensionList(ctx: vscode.ExtensionContext, { isCache = false }) {
  let oldExtensionList = await getExtensions(ctx);
  let newExtensionList: ExtensionList = {};

  for (const item of await getAllExtensions()) {
    if (!item.label || !item.description) {
      item.label = item.id;
      if (Object.keys(oldExtensionList).length > 0)
        for (const key in oldExtensionList)
          if (item.id === key) {
            if (item.label === key)
              if (oldExtensionList[key].label)
                item.label = oldExtensionList[key].label;
            if (oldExtensionList[key].description)
              item.description = oldExtensionList[key].description;
            break;
          }
    }

    newExtensionList[item.id] = {
      uuid: item.uuid,
      label: item.label,
      description: item.description,
    };
  }

  if (isCache)
    // Add missing items from the cache
    for (const key in oldExtensionList) {
      let item = newExtensionList[key];
      if (item === undefined)
        newExtensionList[key] = {
          uuid: oldExtensionList[key].uuid,
          label: oldExtensionList[key].label,
          description: oldExtensionList[key].description,
        };
    }

  await setGlobalStateValue(ctx, "extensions", newExtensionList);

  if (!isCache)
    vscode.window.showInformationMessage("Updated the list of installed extensions!");

  return newExtensionList;
}
