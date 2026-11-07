import type { IConnections, INode } from 'n8n-workflow';
import z from 'zod';
export declare const MAX_VERSION_NAME_LENGTH = 80;
export declare const MAX_VERSION_DESCRIPTION_LENGTH = 1000;
export declare const versionNameInputSchema: z.ZodOptional<z.ZodString>;
export declare const versionDescriptionInputSchema: z.ZodOptional<z.ZodString>;
export type VersionMetadata = {
    name: string;
    description: string;
};
export declare function buildCreateVersionMetadata(nodes: INode[]): VersionMetadata;
export declare function buildUpdateVersionMetadata(previous: {
    nodes: INode[];
    connections: IConnections;
}, next: {
    nodes: INode[];
    connections: IConnections;
}): VersionMetadata;
export declare function buildRestoreVersionMetadata(restoredFrom: {
    versionId: string;
    name: string | null;
    createdAt: Date;
}): VersionMetadata;
export declare function resolveVersionMetadata(provided: {
    versionName?: string;
    versionDescription?: string;
}, fallback: VersionMetadata): VersionMetadata;
