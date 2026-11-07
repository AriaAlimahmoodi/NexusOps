import { Logger } from '@n8n/backend-common';
import { Telemetry } from '../../../telemetry';
import type { Skill } from '../entities/skill.entity';
import { SkillRepository } from '../repositories/skill.repository';
export type SkillTelemetrySource = 'ui' | 'agent' | 'mcp' | 'assistant';
export type SkillTelemetryMethod = 'manual' | 'upload' | 'ai';
type SkillTelemetryTarget = Pick<Skill, 'id' | 'projectId' | 'agentId'>;
export type SkillTelemetryRef = SkillTelemetryTarget | string;
export declare class SkillsTelemetry {
    private readonly telemetry;
    private readonly skillRepository;
    private readonly logger;
    constructor(telemetry: Telemetry, skillRepository: SkillRepository, logger: Logger);
    created(userId: string, refs: SkillTelemetryRef[], source: SkillTelemetrySource, method: SkillTelemetryMethod): Promise<void>;
    updated(userId: string, ref: SkillTelemetryRef, source: SkillTelemetrySource, version: number, scopeChanged: boolean): Promise<void>;
    deleted(userId: string, skill: SkillTelemetryTarget, source: SkillTelemetrySource): Promise<void>;
    private resolve;
    private placeResolver;
    private safely;
}
export {};
