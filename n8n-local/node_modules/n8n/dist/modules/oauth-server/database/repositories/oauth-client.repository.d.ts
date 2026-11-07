import { DataSource, Repository } from '@n8n/typeorm';
import { OAuthClient } from '../entities/oauth-client.entity';
export declare class OAuthClientRepository extends Repository<OAuthClient> {
    constructor(dataSource: DataSource);
}
