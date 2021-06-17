export type StorageValue = { key: string; value: string };
export type ExtensionValue = { id: string; uuid: string; label?: string; description?: string };

export type ProfileList = {
  [key: string]: ExtensionList;
};

export type ExtensionList = {
  [key: string]: {
    uuid: string;
    label?: string;
    description?: string;
  };
};



export type StorageKey = `vscodeExtensionProfiles/${StorageKeyID}`;
export type StorageKeyID = "profiles" | "extensions";