import { TransactionRunner, type OperationContext } from '@n8n/db';
import { OAuthGrantRepository } from './database/repositories/oauth-grant.repository';
export declare class OAuthGrantService {
    private readonly txRunner;
    private readonly grantRepository;
    constructor(txRunner: TransactionRunner, grantRepository: OAuthGrantRepository);
    runForActiveUser<T>(userId: string, work: (ctx: OperationContext) => Promise<T>, ctx?: OperationContext): Promise<T>;
}
