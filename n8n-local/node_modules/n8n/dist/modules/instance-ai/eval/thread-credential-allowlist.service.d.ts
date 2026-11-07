export interface EvalCredentialTestTarget {
    credentialType: string;
    baseUrl: string;
    urlField: string;
}
export declare class EvalThreadCredentialAllowlistService {
    private readonly byThread;
    private readonly testBypassByThread;
    private readonly testTargetsByThread;
    set(threadId: string, credentialIds: string[], bypassCredentialTest?: string[]): void;
    get(threadId: string): string[] | undefined;
    shouldBypassTest(threadId: string, credentialId: string): boolean;
    setTestTarget(threadId: string, target: EvalCredentialTestTarget): void;
    getTestTarget(threadId: string, credentialType: string): EvalCredentialTestTarget | undefined;
    clearThread(threadId: string): void;
}
