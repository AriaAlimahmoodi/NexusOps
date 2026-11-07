import { AgentDefinitionService } from '../../../../modules/agents/agent-definition.service';
import { type Agent } from '../../../../modules/agents/entities/agent.entity';
import type { PreparedAgentExport } from './agent-export.types';
import { AgentSerializer } from './agent.serializer';
import type { PackageWriter } from '../../io/package-writer';
import { ExportVersionPolicy } from '../../n8n-packages.types';
import type { ManifestEntry } from '../../spec/manifest.schema';
export declare class AgentExporter {
    private readonly definitionService;
    private readonly serializer;
    constructor(definitionService: AgentDefinitionService, serializer: AgentSerializer);
    prepare(agent: Agent, policy?: ExportVersionPolicy): Promise<PreparedAgentExport | undefined>;
    write(snapshot: PreparedAgentExport, writer: PackageWriter, basePrefix?: string): Promise<ManifestEntry>;
}
