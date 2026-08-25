export interface UpdateOptions {
  noRestart?: boolean;
  cwd?: string;
}

export interface UpdateStep {
  label: string;
  command: string;
  ok: boolean;
}

export interface UpdateResult {
  ok: boolean;
  restartOk: boolean;
  log: UpdateStep[];
}

export declare function runOpenCatzUpdate(options?: UpdateOptions): Promise<UpdateResult>;
