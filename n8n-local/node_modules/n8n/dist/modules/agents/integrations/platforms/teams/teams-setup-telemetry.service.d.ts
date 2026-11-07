import { Telemetry } from '../../../../../telemetry';
type Step = 'create_app' | 'create_bot' | 'install';
export interface TeamsSetupStepReport {
    agentId: string;
    projectId: string;
    userId: string;
    step: Step;
    botRoute?: 'provisioned' | 'manual';
    installRoute?: 'published' | 'submitted';
}
export type TeamsSetupFailure = 'cannot_register_apps' | 'personal_account' | 'secrets_refused' | 'no_contributor_role' | 'provider_registering' | 'endpoint_not_https' | 'teams_channel_failed' | 'not_signed_in';
export declare function withTeamsFailure<E extends Error>(error: E, reason: TeamsSetupFailure): E;
export declare class TeamsSetupTelemetryService {
    private readonly telemetry;
    constructor(telemetry: Telemetry);
    succeeded(report: TeamsSetupStepReport): void;
    failed(report: TeamsSetupStepReport, error: unknown): void;
    private track;
}
export {};
