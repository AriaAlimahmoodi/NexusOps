import type { TagEntity, ITagWithCountDb } from '@n8n/db';
import { TagRepository, TransactionRunner } from '@n8n/db';
import { ExternalHooks } from '../external-hooks';
type GetAllResult<T> = T extends {
    withUsageCount: true;
} ? ITagWithCountDb[] : TagEntity[];
export declare class TagService {
    private externalHooks;
    private tagRepository;
    private txRunner;
    constructor(externalHooks: ExternalHooks, tagRepository: TagRepository, txRunner: TransactionRunner);
    toEntity(attrs: {
        name: string;
        id?: string;
    }): TagEntity;
    save(tag: TagEntity, actionKind: 'create' | 'update'): Promise<TagEntity>;
    reconcileTagId(oldId: string, newId: string): Promise<void>;
    delete(id: string): Promise<import("@n8n/typeorm").DeleteResult>;
    getAll<T extends {
        withUsageCount: boolean;
        limit?: number;
        orderByName?: boolean;
    }>(options?: T): Promise<GetAllResult<T>>;
    getPaginated({ offset, limit }: {
        offset: number;
        limit: number;
    }): Promise<{
        data: TagEntity[];
        count: number;
    }>;
    getById(id: string): Promise<TagEntity>;
    getByIds(ids: string[]): Promise<TagEntity[]>;
    getByNames(names: string[]): Promise<TagEntity[]>;
    getAllByWorkflowId(workflowId: string): Promise<TagEntity[]>;
    listWithUsageCount({ limit }: {
        limit: number;
    }): Promise<{
        data: ITagWithCountDb[];
        totalCount: number;
    }>;
    sortByRequestOrder(tags: TagEntity[], { requestOrder }: {
        requestOrder: string[];
    }): TagEntity[];
    findOrCreateByNames(names: string[]): Promise<TagEntity[]>;
}
export {};
