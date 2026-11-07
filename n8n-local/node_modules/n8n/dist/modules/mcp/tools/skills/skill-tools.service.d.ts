import type { User } from '@n8n/db';
import { SkillsApiService } from '../../../../modules/agents/skills/skills-api.service';
import { Telemetry } from '../../../../telemetry';
import type { RegisterToolFn } from '../../mcp.types';
export declare class McpSkillToolsService {
    private readonly telemetry;
    private readonly skillsApi;
    constructor(telemetry: Telemetry, skillsApi: SkillsApiService);
    registerTools(registerTool: RegisterToolFn, user: User): void;
    private run;
}
