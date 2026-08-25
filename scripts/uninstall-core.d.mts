export interface UninstallOptions {
  isForce?: boolean;
  keepEnv?: boolean;
  keepData?: boolean;
  keepModules?: boolean;
  cwd?: string;
  promptFn?: ((query: string) => Promise<string>) | null;
  logFn?: (...args: any[]) => void;
  printBanner?: boolean;
}

export interface UninstallResult {
  ok: boolean;
  canceled?: boolean;
}

export declare function runCleanUninstall(options?: UninstallOptions): Promise<UninstallResult>;
export declare function safeExec(command: string, options?: { cwd?: string; timeout?: number }): boolean;
export declare function removePath(targetPath: string, description: string, options?: { cwd?: string; logFn?: (...args: any[]) => void }): boolean;
