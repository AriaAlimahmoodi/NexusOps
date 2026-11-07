import { postgresConnectionTest } from 'n8n-nodes-base/dist/nodes/Postgres/v2/methods/credentialTest';
import type { ISupplyDataFunctions, INodeType, INodeTypeDescription, SupplyData } from 'n8n-workflow';
export declare class MemoryPostgresChat implements INodeType {
    description: INodeTypeDescription;
    methods: {
        credentialTest: {
            postgresConnectionTest: typeof postgresConnectionTest;
        };
    };
    supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData>;
}
