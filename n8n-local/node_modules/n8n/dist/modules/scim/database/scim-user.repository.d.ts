import { BaseRepository, TransactionRunner, User, UserRepository, type AuthProviderType, type OperationContext } from '@n8n/db';
import { DataSource, type DeepPartial } from '@n8n/typeorm';
export type ScimUserFilter = {
    attribute: 'userName';
    value: string;
} | {
    attribute: 'externalId';
    value: string;
    providerTypes: AuthProviderType[];
};
export declare class ScimUserRepository extends BaseRepository<User> {
    private readonly userRepository;
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner, userRepository: UserRepository);
    findPage({ skip, take, filter }: {
        skip: number;
        take: number;
        filter?: ScimUserFilter;
    }, ctx: OperationContext): Promise<[User[], number]>;
    createProvisioned(user: DeepPartial<User>, identity: {
        providerId: string;
        providerType: AuthProviderType;
    } | undefined, ctx: OperationContext): Promise<User>;
}
