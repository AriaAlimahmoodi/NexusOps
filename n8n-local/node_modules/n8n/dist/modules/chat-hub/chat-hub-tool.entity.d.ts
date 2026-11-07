import { User, WithTimestamps } from '@n8n/db';
import type { INode } from 'n8n-workflow';
export interface IChatHubTool {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    type: string;
    typeVersion: number;
    ownerId: string;
    definition: INode;
    enabled: boolean;
}
export declare class ChatHubTool extends WithTimestamps {
    id: string;
    name: string;
    type: string;
    typeVersion: number;
    ownerId: string;
    owner?: User;
    definition: INode;
    enabled: boolean;
}
