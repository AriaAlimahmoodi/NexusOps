type SuspendCardPayload = {
    title?: string;
    components: Array<{
        type: string;
        [key: string]: unknown;
    }>;
};
interface ApprovalSuspendPayload {
    type: 'approval';
    toolName: string;
    displayName?: string;
    supportsSessionApproval?: boolean;
}
export declare function isIntegrationActionSuspendPayload(value: unknown): boolean;
export declare function isApprovalSuspendPayload(value: unknown): value is ApprovalSuspendPayload;
export declare function buildSuspendCardPayload(payload: unknown): SuspendCardPayload | undefined;
export {};
