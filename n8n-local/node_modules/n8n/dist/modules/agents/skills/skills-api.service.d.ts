import type { CreateSkillDto, ListSkillsQueryDto, SkillDetail, SkillListResponse, SkillSaveResponse, SaveSkillDto, SkillNewNameQueryDto, SkillNewNameResponse } from '@n8n/api-types';
import { ProjectScopeService } from '@n8n/backend-services';
import { TransactionRunner, UserRepository, type User } from '@n8n/db';
import { SkillRepository } from '../repositories/skill.repository';
import { SkillService } from './skill.service';
import { SkillsTelemetry, type SkillTelemetrySource } from './skills-telemetry';
export declare class SkillsApiService {
    private readonly skillService;
    private readonly skillRepository;
    private readonly projectScopeService;
    private readonly txRunner;
    private readonly userRepository;
    private readonly skillsTelemetry;
    constructor(skillService: SkillService, skillRepository: SkillRepository, projectScopeService: ProjectScopeService, txRunner: TransactionRunner, userRepository: UserRepository, skillsTelemetry: SkillsTelemetry);
    list(user: User, query: ListSkillsQueryDto): Promise<SkillListResponse>;
    get(user: User, skillId: string): Promise<SkillDetail>;
    newName(user: User, query: SkillNewNameQueryDto): Promise<SkillNewNameResponse>;
    create(user: User, payload: CreateSkillDto, source?: SkillTelemetrySource): Promise<SkillDetail>;
    update(user: User, skillId: string, payload: SaveSkillDto, source?: SkillTelemetrySource): Promise<SkillSaveResponse>;
    delete(user: User, skillId: string, source?: SkillTelemetrySource): Promise<void>;
    private toDetail;
    private requireAccess;
    private attachTarget;
    private targetForCreate;
    private assertCanCreateIn;
    private toListItems;
    private findCreators;
}
