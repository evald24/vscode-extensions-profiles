export type StorageValue = { key: string; value: string };
export type ExtensionValue = { id: string; uuid: string; label?: string };

export type ConfigList = {
  [key: string]: [string];
};

export type ExtensionList = {
  [key: string]: {
    uuid: string;
    label?: string;
  };
};
