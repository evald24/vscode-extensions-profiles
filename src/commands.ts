import * as vscode from "vscode";

/* eslint-disable @typescript-eslint/naming-convention */
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

  // console.log(vscode.extensions.all.filter((e) => /^(?!\/Applications\/Visual Studio Code.app\/).*$/g.test(e.extensionPath)));
  vscode.window.showInformationMessage("selectProfile");
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
