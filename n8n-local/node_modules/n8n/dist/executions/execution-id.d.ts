export type ExecutionIdV2 = string & {
    readonly __brand: 'ExecutionIdV2';
};
export declare const isExecutionIdV2: (id: string) => id is ExecutionIdV2;
export declare const isExecutionIdV1: (id: string) => boolean;
export declare const createExecutionIdV2: () => ExecutionIdV2;
