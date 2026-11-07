import { z } from 'zod';
import { BaseCommand } from '../base-command';
declare const flagsSchema: z.ZodObject<{
    input: z.ZodOptional<z.ZodString>;
    separate: z.ZodDefault<z.ZodBoolean>;
    include: z.ZodOptional<z.ZodString>;
    exclude: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    projectId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    input?: string | undefined;
    separate: boolean;
    include?: string | undefined;
    exclude?: string | undefined;
    userId?: string | undefined;
    projectId?: string | undefined;
}, {
    input?: string | undefined;
    separate?: boolean | undefined;
    include?: string | undefined;
    exclude?: string | undefined;
    userId?: string | undefined;
    projectId?: string | undefined;
}>;
export declare class ImportCredentialsCommand extends BaseCommand<z.infer<typeof flagsSchema>> {
    init(): Promise<void>;
    run(): Promise<void>;
    catch(error: Error): Promise<void>;
    private reportSuccess;
    private reportSkipped;
    private admitCredential;
    private storeCredential;
    private validateInstanceCredentialData;
    private checkRelations;
    private readCredentials;
    private parseCredentialProperties;
    private warnOnUnknownProperties;
    private filterCredentialProperties;
    private isCredentialPropertyImportable;
    private getCredentialOwner;
    private credentialExists;
    private getProject;
}
export {};
