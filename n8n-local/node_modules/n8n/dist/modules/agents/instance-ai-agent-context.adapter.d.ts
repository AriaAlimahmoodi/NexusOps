import type { User } from '@n8n/db';
import type { InstanceAiAgentContextReader } from '@n8n/instance-ai';
import { McpRegistryService } from '../../modules/mcp-registry/registry/mcp-registry.service';
import { AgentExecutionService } from './agent-execution.service';
import { AgentIntegrationPersistenceService } from './agent-integration-persistence.service';
import { AgentSkillsService } from './agent-skills.service';
import { AgentTaskService } from './agent-task.service';
import { AgentsSettingsService } from './agents-settings.service';
import { AgentsToolsService } from './agents-tools.service';
import { AgentsService } from './agents.service';
import { AttachableWorkflowsService } from './attachable-workflows.service';
import { AgentSkillRefsService } from './agent-skill-refs.service';
export declare class InstanceAiAgentContextAdapterService {
    private readonly agentsService;
    private readonly agentSkillsService;
    private readonly agentTaskService;
    private readonly agentExecutionService;
    private readonly agentIntegrationService;
    private readonly attachableWorkflowsService;
    private readonly mcpRegistryService;
    private readonly agentsToolsService;
    private readonly agentSkillRefs;
    private readonly agentsSettingsService;
    constructor(agentsService: AgentsService, agentSkillsService: AgentSkillsService, agentTaskService: AgentTaskService, agentExecutionService: AgentExecutionService, agentIntegrationService: AgentIntegrationPersistenceService, attachableWorkflowsService: AttachableWorkflowsService, mcpRegistryService: McpRegistryService, agentsToolsService: AgentsToolsService, agentSkillRefs: AgentSkillRefsService, agentsSettingsService: AgentsSettingsService);
    createReader(user: User, projectId: string): InstanceAiAgentContextReader;
    private lookup;
}
