import type { BaseMessage } from '@langchain/core/messages';
export interface WebFetchSecurityManager {
    isHostAllowed(host: string, url: string): boolean;
    approveDomain(domain: string): void;
    approveAllDomains(): void;
    hasBudget(): boolean;
    recordFetch(): void;
    getStateUpdates(): WebFetchSecurityStateUpdates;
}
export interface WebFetchSecurityStateUpdates {
    approvedDomains?: string[];
    allDomainsApproved?: boolean;
}
export interface MutableWebFetchState {
    approvedDomains: string[];
    allDomainsApproved: boolean;
    webFetchCount: number;
    messages: BaseMessage[];
}
export declare function createLangGraphSecurityManagerFactory(): () => WebFetchSecurityManager;
export declare function createMutableSecurityManagerFactory(mutableState: MutableWebFetchState): () => WebFetchSecurityManager;
