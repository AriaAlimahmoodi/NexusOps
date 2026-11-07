import type { IExecuteFunctions, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { agentsResourceMapping, listSearchAgents } from './methods';
export declare class Airtop implements INodeType {
    description: INodeTypeDescription;
    methods: {
        listSearch: {
            listSearchAgents: typeof listSearchAgents;
        };
        resourceMapping: {
            agentsResourceMapping: typeof agentsResourceMapping;
        };
    };
    execute(this: IExecuteFunctions): Promise<import("n8n-workflow").INodeExecutionData[][]>;
}
//# sourceMappingURL=Airtop.node.d.ts.map