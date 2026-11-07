import { WithTimestampsAndStringId } from '@n8n/db';
export declare class AgentThreadEntity extends WithTimestampsAndStringId {
    resourceId: string;
    title: string | null;
    metadata: string | null;
}
