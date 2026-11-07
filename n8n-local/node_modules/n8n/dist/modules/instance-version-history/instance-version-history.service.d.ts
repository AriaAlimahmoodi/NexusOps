import { Logger } from '@n8n/backend-common';
import { InstanceSettings } from 'n8n-core';
import { InstanceVersionHistoryRepository } from './database/repositories/instance-version-history.repository';
import type { SemVer, VersionEntry } from './instance-version-history.types';
export declare class InstanceVersionHistoryService {
    private readonly repository;
    private readonly logger;
    private readonly instanceSettings;
    private _cache;
    constructor(repository: InstanceVersionHistoryRepository, logger: Logger, instanceSettings: InstanceSettings);
    init(retries?: number): Promise<void>;
    private getCache;
    private checkAndRecordCurrentVersion;
    getMinVersionSince(since: Date): Promise<SemVer | undefined>;
    getDateSinceContinuouslyAtLeastVersion(target: SemVer): Promise<Date | undefined>;
    getCurrentVersionDate(): Promise<VersionEntry | undefined>;
    getFirstAdoptionDate(target: SemVer): Promise<Date | undefined>;
}
