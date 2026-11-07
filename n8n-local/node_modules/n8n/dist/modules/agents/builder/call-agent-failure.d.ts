export interface CallAgentFailure {
    code: string;
    message: string;
}
export declare function describeCallAgentFailure(message: string): CallAgentFailure;
