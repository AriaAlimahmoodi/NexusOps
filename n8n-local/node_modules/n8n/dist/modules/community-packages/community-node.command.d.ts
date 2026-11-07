import type { User } from '@n8n/db';
import { z } from 'zod';
import { BaseCommand } from '../../commands/base-command';
import { InstalledNodes } from './installed-nodes.entity';
import { InstalledPackages } from './installed-packages.entity';
declare const flagsSchema: z.ZodObject<{
    uninstall: z.ZodOptional<z.ZodBoolean>;
    package: z.ZodOptional<z.ZodString>;
    credential: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    uninstall?: boolean | undefined;
    package?: string | undefined;
    credential?: string | undefined;
    userId?: string | undefined;
}, {
    uninstall?: boolean | undefined;
    package?: string | undefined;
    credential?: string | undefined;
    userId?: string | undefined;
}>;
export declare class CommunityNode extends BaseCommand<z.infer<typeof flagsSchema>> {
    run(): Promise<void>;
    catch(error: Error): Promise<void>;
    uninstallCredential(credentialType: string, userId: string): Promise<void>;
    findUserById(userId: string): Promise<User | null>;
    findCredentialsByType(credentialType: string): Promise<import("@n8n/db").CredentialsEntity[]>;
    deleteCredential(user: User, credentialId: string): Promise<boolean>;
    uninstallPackage(packageName: string): Promise<void>;
    pruneDependencies(): Promise<void>;
    deleteCommunityNode(node: InstalledNodes): Promise<import("@n8n/typeorm").DeleteResult>;
    removeCommunityPackage(packageName: string, communityPackage: InstalledPackages): Promise<void>;
    findCommunityPackage(packageName: string): Promise<InstalledPackages | null>;
}
export {};
