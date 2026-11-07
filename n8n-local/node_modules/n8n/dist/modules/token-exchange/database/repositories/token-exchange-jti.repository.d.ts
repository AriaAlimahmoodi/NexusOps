import { GlobalConfig } from '@n8n/config';
import { DataSource, Repository } from '@n8n/typeorm';
import { TokenExchangeJti } from '../entities/token-exchange-jti.entity';
export declare class TokenExchangeJtiRepository extends Repository<TokenExchangeJti> {
    private readonly dbType;
    private readonly escapedTableName;
    constructor(dataSource: DataSource, globalConfig: GlobalConfig);
    atomicConsume(jti: string, expiresAt: Date): Promise<boolean>;
    deleteExpiredBatch(batchSize: number): Promise<number>;
}
