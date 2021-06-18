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

export type PackageJson = {
	"name": string,
	"displayName": string,
  "description": string,
  "version": string,
  "publisher": string,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "__metadata": {
		"id": string,
		"publisherId": string,
		"publisherDisplayName": string,
    "installedTimestamp": number
  },
  [key: string]: any
};

export type StorageKey = `vscodeExtensionProfiles/${StorageKeyID}`;
export type StorageKeyID = "profiles" | "extensions";