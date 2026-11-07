import { DataSource, Repository } from '@n8n/typeorm';
import { TrustedKeyEntity } from '../entities/trusted-key.entity';
export declare class TrustedKeyRepository extends Repository<TrustedKeyEntity> {
    constructor(dataSource: DataSource);
    findBySourceAndKid(sourceId: string, kid: string): Promise<TrustedKeyEntity | null>;
    findAllByKid(kid: string): Promise<TrustedKeyEntity[]>;
}
