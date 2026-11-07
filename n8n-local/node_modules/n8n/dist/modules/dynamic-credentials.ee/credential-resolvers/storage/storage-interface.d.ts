export interface ICredentialEntriesStorage {
    getCredentialData(credentialId: string, subjectId: string, resolverId: string, storageOptions: Record<string, unknown>): Promise<string | null>;
    setCredentialData(credentialId: string, subjectId: string, resolverId: string, data: string, storageOptions: Record<string, unknown>): Promise<void>;
    deleteCredentialData?(credentialId: string, subjectId: string, resolverId: string, storageOptions: Record<string, unknown>): Promise<void>;
}
