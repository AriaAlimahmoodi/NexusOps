import { BaseRepository, TransactionRunner, type OperationContext } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { AuthorizationCode } from '../entities/oauth-authorization-code.entity';
export declare class AuthorizationCodeRepository extends BaseRepository<AuthorizationCode> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    insertCode(code: Pick<AuthorizationCode, 'code' | 'clientId' | 'userId' | 'redirectUri' | 'codeChallenge' | 'codeChallengeMethod' | 'state' | 'resource' | 'scope' | 'expiresAt' | 'used'>, ctx: OperationContext): Promise<void>;
    consumeCode(code: string, ctx: OperationContext): Promise<boolean>;
}
