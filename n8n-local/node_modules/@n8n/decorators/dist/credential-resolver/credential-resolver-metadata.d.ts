import { CredentialResolverClass } from './credential-resolver';
type CredentialResolverEntry = {
    class: CredentialResolverClass;
};
export declare class CredentialResolverEntryMetadata {
    private readonly credentialResolverEntries;
    register(credentialResolverEntry: CredentialResolverEntry): void;
    getEntries(): [CredentialResolverEntry, CredentialResolverEntry][];
    getClasses(): CredentialResolverClass[];
}
export declare const CredentialResolver: <T extends CredentialResolverClass>() => (target: T) => any;
export {};
