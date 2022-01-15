declare global {
  namespace NodeJS {
    interface ProcessEnv {
      VXP_GLOBAL_STORAGE_PATH: string;
      VXP_WORKSPACE_STORAGE_PATH?: string;
      VXP_WORKSPACE_STORAGE_UUID?: string;
      VXP_WORKSPACE_STORAGE_PATH_UUID?: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
