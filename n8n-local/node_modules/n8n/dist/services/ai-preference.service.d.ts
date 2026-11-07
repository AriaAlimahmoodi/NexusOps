import type { AiPreferenceCountDto, AiPreferenceDto, AiPreferenceListDto, AiPreferenceRequestDto, AiPreferenceScope, AiPreferenceSortOption, AiPreferenceSource, AiPreferencesAppliedPayload } from '@n8n/api-types';
import type { AiPreference, Project, User } from '@n8n/db';
import { AiPreferenceRepository, ProjectRelationRepository, ProjectRepository, UserRepository } from '@n8n/db';
export type AiPreferenceProjectRef = {
    id: string;
    name: string;
    type?: Project['type'];
};
export type AiPreferenceItem = {
    id: string;
    scope: 'instance' | 'user' | 'project';
    project?: string;
    text: string;
};
export type AppliedPreference = {
    id: string;
    content: string;
};
export type ApplicableAiPreferences = {
    instance: AppliedPreference[];
    user: AppliedPreference[];
    projects: Array<AiPreferenceProjectRef & {
        items: AppliedPreference[];
    }>;
};
export type AiPreferenceUpdateRequest = {
    content: string;
    scope?: AiPreferenceScope;
    projectId?: string | null;
    userId?: string | null;
};
export declare class AiPreferenceService {
    private readonly aiPreferenceRepository;
    private readonly projectRepository;
    private readonly projectRelationRepository;
    private readonly userRepository;
    constructor(aiPreferenceRepository: AiPreferenceRepository, projectRepository: ProjectRepository, projectRelationRepository: ProjectRelationRepository, userRepository: UserRepository);
    getApplicable(userId: string, projects: AiPreferenceProjectRef[]): Promise<ApplicableAiPreferences>;
    getApplicableForProject(user: User, projectId: string): Promise<ApplicableAiPreferences>;
    getApplicableAcrossProjects(user: User): Promise<ApplicableAiPreferences>;
    list(user: User, page: {
        skip: number;
        take: number;
        ids?: string[];
        sortBy?: AiPreferenceSortOption;
    }): Promise<AiPreferenceListDto>;
    count(user: User): Promise<AiPreferenceCountDto>;
    create(user: User, request: AiPreferenceRequestDto, source: AiPreferenceSource): Promise<AiPreferenceDto>;
    update(user: User, id: string, request: AiPreferenceUpdateRequest): Promise<AiPreferenceDto>;
    updateContent(user: User, id: string, content: string): Promise<AiPreferenceDto>;
    delete(user: User, id: string): Promise<void>;
    undoWrite(user: User, id: string, source: AiPreferenceSource): Promise<AiPreferenceDto>;
    getById(user: User, id: string): Promise<AiPreferenceDto>;
    private projectAccess;
    private visibleTo;
    private requireVisible;
    private canSee;
    private canWrite;
    private assertCanWrite;
    private keepTargetOf;
    private isMove;
    private resolveTarget;
    private assertEditNamesOwner;
    private assertNoProject;
    private assertNoUser;
    private assertScopeHasRoom;
    private assertNotDuplicate;
    private scopesFor;
    private toDto;
}
export declare function groupAiPreferences(rows: AiPreference[], projects: AiPreferenceProjectRef[]): ApplicableAiPreferences;
export declare function renderAiPreferences(preferences: ApplicableAiPreferences): string;
export declare function flattenAiPreferences(preferences: ApplicableAiPreferences): AiPreferenceItem[];
export type AppliedPreferencesInjection = {
    injectedThisTurn: true;
} | {
    injectedThisTurn: false;
    carriedFromRunId?: string;
};
export declare function buildAppliedPreferencesPayload({ preferences, renderedLength, ...injection }: {
    preferences: ApplicableAiPreferences;
    renderedLength: number;
} & AppliedPreferencesInjection): AiPreferencesAppliedPayload;
export declare const AI_PREFERENCES_REPLACES_EARLIER = "This block lists the saved preferences that apply now. It replaces every earlier ai-preferences block and earlier chat or tool claims about saved preferences. Do not treat a preference missing from this block as a standing rule, even if the user previously asked to save it. Follow the current user request.";
export declare const AI_PREFERENCES_CLEARED_BLOCK = "<ai-preferences>\nThis block lists the saved preferences that apply now. It replaces every earlier ai-preferences block and earlier chat or tool claims about saved preferences. Do not treat a preference missing from this block as a standing rule, even if the user previously asked to save it. Follow the current user request.\n\nThe user has no saved preferences now. Do not continue applying a previously saved preference from this conversation.\n</ai-preferences>";
export declare function renderAiPreferencesBlock(preferences: ApplicableAiPreferences): string | undefined;
