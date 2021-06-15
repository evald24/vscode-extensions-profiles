/* eslint-disable @typescript-eslint/naming-convention */

import path = require("path");
import * as vscode from "vscode";
import { getProfiles } from "./config";
import { getExtensionsPath, getVSCodePath } from "./utils";

export const CommandTypes = ["vscode-extension-profiles.Select", "vscode-extension-profiles.Edite", "vscode-extension-profiles.Delete"] as const;

type Args = { ctx: vscode.ExtensionContext };

export const Commands: Record<typeof CommandTypes[number], (args: Args) => any> = {
  "vscode-extension-profiles.Select": selectProfile,
  "vscode-extension-profiles.Edite": editeProfile,
  "vscode-extension-profiles.Delete": deleteProfile,
};

// Select profile ...
function selectProfile({ ctx }: Args): any {
  console.log(ctx);
  // vscode.commands.executeCommand('workbench.extensions.installExtension', 'extensionId');
  // let list = vscode.commands.executeCommand("workbench.extensions.search", "@installed ");
  // console.log(list);
  console.log("extension", getExtensionsPath());
  console.log("code path", getVSCodePath());
  // console.log(vscode.extensions.all.filter((e) => /^(?!\/Applications\/Visual Studio Code.app\/).*$/g.test(e.extensionPath)));
  let items: vscode.QuickPickItem[] = [];

  console.log(Object.keys(getProfiles()));

  for (const item of Object.keys(getProfiles())) {
    items.push({
      label: item,
    });
  }

  // for (const item of getAllExtensions()) {
  //   items.push({
  //     label: item.packageJSON.displayName || item.packageJSON.name || item.id,
  //     description: item.id,
  //     detail: item.packageJSON.description,
  //     picked: true,
  //   });
  // }

  vscode.window.showQuickPick(items).then((selection) => {
    // the user canceled the selection
    if (!selection) {
      return;
    }

    console.log(selection);
  });
}

// Edite profile ...
function editeProfile({ ctx }: Args): any {
  console.log(ctx);
  vscode.window.showInformationMessage("editeProfile");
}

// Delete profile ...
function deleteProfile({ ctx }: Args): any {
  console.log(ctx);
  vscode.window.showInformationMessage("deleteProfile");
}

function ReloadWindow() {
  vscode.commands.executeCommand("workbench.action.reloadWindow");
}
