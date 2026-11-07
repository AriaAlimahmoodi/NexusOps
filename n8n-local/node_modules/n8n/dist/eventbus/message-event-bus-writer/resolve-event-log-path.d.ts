export type EventLogProcessType = 'main' | 'worker' | 'webhook-processor';
export interface ResolveEventLogPathInput {
    logFullPath: string;
    logBaseName: string;
    instanceDir: string;
    processType: EventLogProcessType;
}
export interface ResolvedEventLogPath {
    logFullBasePath: string;
    logFileName: string;
}
export declare function resolveEventLogPath(input: ResolveEventLogPathInput): ResolvedEventLogPath;
