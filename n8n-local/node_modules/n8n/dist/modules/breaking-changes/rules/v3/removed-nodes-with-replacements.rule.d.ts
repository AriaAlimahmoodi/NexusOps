import type { BreakingChangeAffectedWorkflow, BreakingChangeRecommendation } from '@n8n/api-types';
import type { WorkflowEntity } from '@n8n/db';
import type { INode } from 'n8n-workflow';
import type { BreakingChangeRuleMetadata, WorkflowDetectionReport } from '../../types';
export declare const BinaryInputLoaderRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const ChatMessagesRetrieverRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const ConvertToFromBinaryDataRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const CronRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const FunctionRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const FunctionItemRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const HtmlExtractRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const HttpRequestToolRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const ICalendarRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const ItemListsRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const InMemoryVectorStoreInsertRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const InMemoryVectorStoreLoadRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const IntervalRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const JsonInputLoaderRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const ManualChatTriggerRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const OpenAiAssistantRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const OpenAiRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const OpenAiModelRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const PineconeInsertRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const PineconeLoadRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const ReadBinaryFileRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const ReadBinaryFilesRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const ReadPdfRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const SerpApiGoogleSearchRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const SupabaseInsertRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const SupabaseLoadRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const WorkflowTriggerRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const WriteBinaryFileRemovedRule: {
    new (): {
        id: string;
        getMetadata(): BreakingChangeRuleMetadata;
        getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
        detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
    };
};
export declare const directNodeReplacementRules: {
    rule: {
        new (): {
            id: string;
            getMetadata(): BreakingChangeRuleMetadata;
            getRecommendations(_workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
            detectWorkflow(_workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
        };
    };
    removedNodeType: string;
}[];
