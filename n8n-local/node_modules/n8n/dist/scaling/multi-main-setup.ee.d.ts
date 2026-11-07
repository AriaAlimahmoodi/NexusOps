import { Logger, TypedEmitter } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import { MultiMainMetadata } from '@n8n/decorators';
import { ErrorReporter, InstanceSettings } from 'n8n-core';
import { LeaderElectionClient } from '../scaling/leader-election-client';
type MultiMainEvents = {
    'leader-stepdown': never;
    'leader-takeover': never;
};
export declare class MultiMainSetup extends TypedEmitter<MultiMainEvents> {
    private readonly logger;
    private readonly instanceSettings;
    private readonly globalConfig;
    private readonly metadata;
    private readonly errorReporter;
    private readonly client;
    private leaderCheckInterval;
    private leaderCheckInProgress;
    private get hostId();
    constructor(logger: Logger, instanceSettings: InstanceSettings, globalConfig: GlobalConfig, metadata: MultiMainMetadata, errorReporter: ErrorReporter, client: LeaderElectionClient);
    init(): Promise<void>;
    shutdown(): Promise<void>;
    fetchLeaderKey(): Promise<string | null>;
    registerEventHandlers(): void;
    private attachHandler;
    private checkLeader;
    private checkAreWeStillLeader;
    private checkCanBecomeLeader;
    private takeOverAsLeader;
    private stepDownToFollower;
    private logRedisCommandFailure;
}
export {};
