export type SDKFunctions = Record<string, (...args: any[]) => unknown>;
export declare function interpretSDKCode(code: string, sdkFunctions: SDKFunctions): unknown;
