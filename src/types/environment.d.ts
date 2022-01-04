declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GLOBAL_STORAGE_PATH: string;
      WORKSPACE_STORAGE_PATH: string | undefined;
      WORKSPACE_STORAGE_UUID: string | undefined;
      WORKSPACE_STORAGE_PATH_UUID: string | undefined;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
