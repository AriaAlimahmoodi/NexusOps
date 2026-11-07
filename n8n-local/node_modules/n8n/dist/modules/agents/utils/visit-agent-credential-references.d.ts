interface CredentialReference {
    id: string;
    setId: (id: string) => void;
    managedToken?: string;
}
type CredentialVisitor = (reference: CredentialReference) => void;
export declare function visitAgentCredentialReferences(config: unknown, visit: CredentialVisitor): void;
export {};
