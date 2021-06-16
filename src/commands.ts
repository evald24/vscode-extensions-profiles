/* eslint-disable @typescript-eslint/naming-convention */

import * as vscode from "vscode";
import { getExtensionList, getProfiles, setExtensionList } from "./config";
import { getAllExtensions } from "./storage";
import { ExtensionList } from "./types";
export const CommandTypes = [
  "vscode-extension-profiles.Apply",
  "vscode-extension-profiles.Refresh",
  "vscode-extension-profiles.Edite",
  "vscode-extension-profiles.Delete",
] as const;

type Args = { ctx: vscode.ExtensionContext };

export const Commands: Record<typeof CommandTypes[number], (args: Args) => any> = {
  "vscode-extension-profiles.Apply": applyProfile,
  "vscode-extension-profiles.Edite": editeProfile,
  "vscode-extension-profiles.Refresh": refreshExtensionList,
  "vscode-extension-profiles.Delete": deleteProfile,
};

const isDev = true;
// Select profile ...
async function applyProfile({ ctx }: Args) {
  const profiles = getProfiles();
  const profilesKeys = Object.keys(profiles);
  if (profilesKeys.length <= 0) {
    vscode.window.showErrorMessage("Extension profiles: No profiles found, please create a profile first.", { modal: true });
    return;
  }

  let fsPath;
  if (vscode.workspace.workspaceFolders !== undefined) {
    fsPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
  } else {
    vscode.window.showErrorMessage("Extension profiles: Working folder not found, open a folder an try again", { modal: true });
    return;
  }

  // console.log(vscode.extensions.all.filter((e) => /^(?!\/Applications\/Visual Studio Code.app\/).*$/g.test(e.extensionPath)));
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

  // let uuid = await getWorkspaceUUID(vscode.Uri.parse(fsPath));
}

async function refreshExtensionList() {
  let oldConfig = getExtensionList(),
    keysConfig = Object.keys(oldConfig);
  let newConfig: ExtensionList = {};

  for (const item of await getAllExtensions()) {
    if (!item.label) {
      item.label = item.id;
      if (keysConfig.length > 0) {
        for (const key of keysConfig) {
          if (item.id === key) {
            if (oldConfig[key].label) {
              // Если в конфиге указано имя расширения
              item.label === oldConfig[key].label;
            }
            break;
          }
        }
      }
    }

    newConfig[item.id] = {
      uuid: item.uuid,
      label: item.label,
    };
  }

  await setExtensionList(newConfig);

  vscode.window.showInformationMessage("Extension profiles: Updated the list of installed extensions");
}

// Select profile ...
// async function selectProfile({ ctx }: Args) {
//   console.log(ctx);
//   // vscode.commands.executeCommand('workbench.extensions.installExtension', 'extensionId');
//   // vscode.commands.executeCommand("workbench.action.reloadWindow");
//   // let list = vscode.commands.executeCommand("workbench.extensions.search", "@installed ");
//   // let list = vscode.commands.executeCommand("workbench.action.openDefaultKeybindingsFile");
//   // console.log(list);
//   let fsPath;
//   if (vscode.workspace.workspaceFolders !== undefined) {
//     fsPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
//   } else {
//     vscode.window.showErrorMessage("vscode-extension-profiles: Working folder not found, open a folder an try again");
//     return;
//   }

//   console.log(await getWorkspaceUUID(vscode.Uri.parse(fsPath)));

//   // console.log(vscode.extensions.all.filter((e) => /^(?!\/Applications\/Visual Studio Code.app\/).*$/g.test(e.extensionPath)));
//   let items: vscode.QuickPickItem[] = [];

//   console.log(Object.keys(getProfiles()));

//   for (const item of Object.keys(getProfiles())) {
//     items.push({
//       label: item,
//     });
//   }

//   // for (const item of getAllExtensions()) {
//   //   items.push({
//   //     label: item.packageJSON.displayName || item.packageJSON.name || item.id,
//   //     description: item.id,
//   //     detail: item.packageJSON.description,
//   //     picked: true,
//   //   });
//   // }

//   vscode.window
//     .showQuickPick(items, {
//       canPickMany: true,
//     })
//     .then((selection) => {
//       // the user canceled the selection
//       if (!selection) {
//         return;
//       }

//       console.log(selection);
//     });
// }
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
