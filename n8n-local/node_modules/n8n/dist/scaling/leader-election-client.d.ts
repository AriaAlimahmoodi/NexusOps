import { GlobalConfig } from '@n8n/config';
import { InstanceSettings } from 'n8n-core';
import { type Result } from '@n8n/utils/result';
import { RedisClientService } from '@n8n/backend-services';
export type TtlRenewalResultKeyMissing = {
    id: 'key-missing';
};
export type TtlRenewalResultOtherHostIsLeader = {
    id: 'other-host-is-leader';
    currentLeaderId: string;
};
export type TtlRenewalResultSuccess = {
    id: 'success';
};
export type TtlRenewalResult = TtlRenewalResultKeyMissing | TtlRenewalResultOtherHostIsLeader | TtlRenewalResultSuccess;
export declare class LeaderElectionClient {
    private readonly instanceSettings;
    private readonly redisClient;
    private readonly leaderKey;
    private readonly leaderKeyTtlInS;
    private get hostId();
    constructor(instanceSettings: InstanceSettings, globalConfig: GlobalConfig, redisClientService: RedisClientService);
    getLeader(): Promise<Result<string | null, Error>>;
    setLeaderIfNotExists(): Promise<Result<boolean, Error>>;
    tryRenewLeaderTtl(): Promise<Result<TtlRenewalResult, Error>>;
    clearLeader(): Promise<Result<void, Error>>;
    destroy(): void;
}
