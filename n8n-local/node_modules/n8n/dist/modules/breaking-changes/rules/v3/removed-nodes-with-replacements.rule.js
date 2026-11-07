"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.directNodeReplacementRules = exports.WriteBinaryFileRemovedRule = exports.WorkflowTriggerRemovedRule = exports.SupabaseLoadRemovedRule = exports.SupabaseInsertRemovedRule = exports.SerpApiGoogleSearchRemovedRule = exports.ReadPdfRemovedRule = exports.ReadBinaryFilesRemovedRule = exports.ReadBinaryFileRemovedRule = exports.PineconeLoadRemovedRule = exports.PineconeInsertRemovedRule = exports.OpenAiModelRemovedRule = exports.OpenAiRemovedRule = exports.OpenAiAssistantRemovedRule = exports.ManualChatTriggerRemovedRule = exports.JsonInputLoaderRemovedRule = exports.IntervalRemovedRule = exports.InMemoryVectorStoreLoadRemovedRule = exports.InMemoryVectorStoreInsertRemovedRule = exports.ItemListsRemovedRule = exports.ICalendarRemovedRule = exports.HttpRequestToolRemovedRule = exports.HtmlExtractRemovedRule = exports.FunctionItemRemovedRule = exports.FunctionRemovedRule = exports.CronRemovedRule = exports.ConvertToFromBinaryDataRemovedRule = exports.ChatMessagesRetrieverRemovedRule = exports.BinaryInputLoaderRemovedRule = void 0;
const decorators_1 = require("@n8n/decorators");
function createNodeReplacementRule({ id, removedNodeName, removedNodeType, recommendations, }) {
    let NodeReplacementRule = class NodeReplacementRule {
        constructor() {
            this.id = `${id}-v3`;
        }
        getMetadata() {
            return {
                version: 'v3',
                title: `${removedNodeName} node removed`,
                description: `The ${removedNodeName} node is no longer supported. ${recommendations.map(({ description }) => description).join(' ')}`,
                category: "workflow",
                impact: 'executionsFail',
            };
        }
        async getRecommendations(_workflowResults) {
            await Promise.resolve();
            return recommendations;
        }
        async detectWorkflow(_workflow, nodesGroupedByType) {
            const removedNodes = nodesGroupedByType.get(removedNodeType) ?? [];
            if (removedNodes.length === 0)
                return { isAffected: false, issues: [] };
            await Promise.resolve();
            return {
                isAffected: true,
                issues: removedNodes.map((node) => ({
                    title: `${removedNodeName} node '${node.name}' is no longer supported`,
                    description: recommendations
                        .map((recommendation) => recommendation.description)
                        .join(' '),
                    level: 'error',
                    nodeId: node.id,
                    nodeName: node.name,
                })),
            };
        }
    };
    NodeReplacementRule = __decorate([
        (0, decorators_1.BreakingChangeRule)({ version: 'v3' })
    ], NodeReplacementRule);
    return NodeReplacementRule;
}
exports.BinaryInputLoaderRemovedRule = createNodeReplacementRule({
    id: 'binary-input-loader-removed',
    removedNodeName: 'Binary Input Loader',
    removedNodeType: '@n8n/n8n-nodes-langchain.documentBinaryInputLoader',
    recommendations: [
        {
            action: 'Replace with Default Data Loader',
            description: 'Replace this node with Default Data Loader and set Type of Data to Binary.',
        },
    ],
});
exports.ChatMessagesRetrieverRemovedRule = createNodeReplacementRule({
    id: 'chat-messages-retriever-removed',
    removedNodeName: 'Chat Messages Retriever',
    removedNodeType: '@n8n/n8n-nodes-langchain.memoryChatRetriever',
    recommendations: [
        {
            action: 'Replace with Memory Manager',
            description: 'Replace this node with Memory Manager and set Operation Mode to Get Many Messages.',
        },
    ],
});
exports.ConvertToFromBinaryDataRemovedRule = createNodeReplacementRule({
    id: 'convert-to-from-binary-data-removed',
    removedNodeName: 'Convert to/from binary data',
    removedNodeType: 'n8n-nodes-base.moveBinaryData',
    recommendations: [
        {
            action: 'Replace with Convert to File',
            description: 'For Base64 data to a binary file, replace this node with Convert to File and select Move Base64 String to File.',
        },
        {
            action: 'Replace with Extract From File',
            description: 'For a binary file to Base64 data, replace this node with Extract From File and select Move File to Base64 String.',
        },
    ],
});
exports.CronRemovedRule = createNodeReplacementRule({
    id: 'cron-removed',
    removedNodeName: 'Cron',
    removedNodeType: 'n8n-nodes-base.cron',
    recommendations: [
        {
            action: 'Replace with Schedule Trigger',
            description: 'Replace this node with Schedule Trigger and recreate its schedule rules.',
        },
    ],
});
exports.FunctionRemovedRule = createNodeReplacementRule({
    id: 'function-removed',
    removedNodeName: 'Function',
    removedNodeType: 'n8n-nodes-base.function',
    recommendations: [
        {
            action: 'Replace with Code',
            description: 'Replace this node with Code and set Mode to Run Once for All Items.',
        },
    ],
});
exports.FunctionItemRemovedRule = createNodeReplacementRule({
    id: 'function-item-removed',
    removedNodeName: 'Function Item',
    removedNodeType: 'n8n-nodes-base.functionItem',
    recommendations: [
        {
            action: 'Replace with Code',
            description: 'Replace this node with Code and set Mode to Run Once for Each Item.',
        },
    ],
});
exports.HtmlExtractRemovedRule = createNodeReplacementRule({
    id: 'html-extract-removed',
    removedNodeName: 'HTML Extract',
    removedNodeType: 'n8n-nodes-base.htmlExtract',
    recommendations: [
        {
            action: 'Replace with HTML',
            description: 'Replace this node with HTML and select Extract HTML Content.',
        },
    ],
});
exports.HttpRequestToolRemovedRule = createNodeReplacementRule({
    id: 'http-request-tool-removed',
    removedNodeName: 'HTTP Request Tool',
    removedNodeType: '@n8n/n8n-nodes-langchain.toolHttpRequest',
    recommendations: [
        {
            action: 'Replace with HTTP Request',
            description: 'Replace this node with HTTP Request and configure it for AI tool use.',
        },
    ],
});
exports.ICalendarRemovedRule = createNodeReplacementRule({
    id: 'i-calendar-removed',
    removedNodeName: 'iCalendar',
    removedNodeType: 'n8n-nodes-base.iCal',
    recommendations: [
        {
            action: 'Replace with Convert to File',
            description: 'Replace this node with Convert to File and select Convert to ICS.',
        },
    ],
});
exports.ItemListsRemovedRule = createNodeReplacementRule({
    id: 'item-lists-removed',
    removedNodeName: 'Item Lists',
    removedNodeType: 'n8n-nodes-base.itemLists',
    recommendations: [
        {
            action: 'Replace with Aggregate',
            description: 'For Concatenate Items, replace this node with Aggregate.',
        },
        {
            action: 'Replace with Limit',
            description: 'For Limit, replace this node with Limit.',
        },
        {
            action: 'Replace with Remove Duplicates',
            description: 'For Remove Duplicates, replace this node with Remove Duplicates.',
        },
        {
            action: 'Replace with Sort',
            description: 'For Sort, replace this node with Sort.',
        },
        {
            action: 'Replace with Split Out',
            description: 'For Split Out Items, replace this node with Split Out.',
        },
        {
            action: 'Replace with Summarize',
            description: 'For Summarize, replace this node with Summarize.',
        },
    ],
});
exports.InMemoryVectorStoreInsertRemovedRule = createNodeReplacementRule({
    id: 'in-memory-vector-store-insert-removed',
    removedNodeName: 'In Memory Vector Store Insert',
    removedNodeType: '@n8n/n8n-nodes-langchain.vectorStoreInMemoryInsert',
    recommendations: [
        {
            action: 'Replace with In-Memory Vector Store',
            description: 'Replace this node with In-Memory Vector Store and select Insert Documents.',
        },
    ],
});
exports.InMemoryVectorStoreLoadRemovedRule = createNodeReplacementRule({
    id: 'in-memory-vector-store-load-removed',
    removedNodeName: 'In Memory Vector Store Load',
    removedNodeType: '@n8n/n8n-nodes-langchain.vectorStoreInMemoryLoad',
    recommendations: [
        {
            action: 'Replace with In-Memory Vector Store',
            description: 'Replace this node with In-Memory Vector Store and select Get Many.',
        },
    ],
});
exports.IntervalRemovedRule = createNodeReplacementRule({
    id: 'interval-removed',
    removedNodeName: 'Interval',
    removedNodeType: 'n8n-nodes-base.interval',
    recommendations: [
        {
            action: 'Replace with Schedule Trigger',
            description: 'Replace this node with Schedule Trigger and recreate its interval.',
        },
    ],
});
exports.JsonInputLoaderRemovedRule = createNodeReplacementRule({
    id: 'json-input-loader-removed',
    removedNodeName: 'JSON Input Loader',
    removedNodeType: '@n8n/n8n-nodes-langchain.documentJsonInputLoader',
    recommendations: [
        {
            action: 'Replace with Default Data Loader',
            description: 'Replace this node with Default Data Loader and set Type of Data to JSON.',
        },
    ],
});
exports.ManualChatTriggerRemovedRule = createNodeReplacementRule({
    id: 'manual-chat-trigger-removed',
    removedNodeName: 'Manual Chat Trigger',
    removedNodeType: '@n8n/n8n-nodes-langchain.manualChatTrigger',
    recommendations: [
        {
            action: 'Replace with Chat Trigger',
            description: 'Replace this node with Chat Trigger and recreate its chat settings.',
        },
    ],
});
exports.OpenAiAssistantRemovedRule = createNodeReplacementRule({
    id: 'openai-assistant-removed',
    removedNodeName: 'OpenAI Assistant',
    removedNodeType: '@n8n/n8n-nodes-langchain.openAiAssistant',
    recommendations: [
        {
            action: 'Replace with OpenAI',
            description: 'Replace this node with OpenAI and select the Assistant resource.',
        },
    ],
});
exports.OpenAiRemovedRule = createNodeReplacementRule({
    id: 'openai-removed',
    removedNodeName: 'OpenAI',
    removedNodeType: 'n8n-nodes-base.openAi',
    recommendations: [
        {
            action: 'Replace with OpenAI',
            description: 'Replace this node with the new OpenAI node and recreate its settings.',
        },
    ],
});
exports.OpenAiModelRemovedRule = createNodeReplacementRule({
    id: 'openai-model-removed',
    removedNodeName: 'OpenAI Model',
    removedNodeType: '@n8n/n8n-nodes-langchain.lmOpenAi',
    recommendations: [
        {
            action: 'Replace with OpenAI Chat Model',
            description: 'Replace this node with OpenAI Chat Model and recreate its model settings.',
        },
    ],
});
exports.PineconeInsertRemovedRule = createNodeReplacementRule({
    id: 'pinecone-insert-removed',
    removedNodeName: 'Pinecone: Insert',
    removedNodeType: '@n8n/n8n-nodes-langchain.vectorStorePineconeInsert',
    recommendations: [
        {
            action: 'Replace with Pinecone Vector Store',
            description: 'Replace this node with Pinecone Vector Store and select Insert Documents.',
        },
    ],
});
exports.PineconeLoadRemovedRule = createNodeReplacementRule({
    id: 'pinecone-load-removed',
    removedNodeName: 'Pinecone: Load',
    removedNodeType: '@n8n/n8n-nodes-langchain.vectorStorePineconeLoad',
    recommendations: [
        {
            action: 'Replace with Pinecone Vector Store',
            description: 'Replace this node with Pinecone Vector Store and select Get Many.',
        },
    ],
});
exports.ReadBinaryFileRemovedRule = createNodeReplacementRule({
    id: 'read-binary-file-removed',
    removedNodeName: 'Read Binary File',
    removedNodeType: 'n8n-nodes-base.readBinaryFile',
    recommendations: [
        {
            action: 'Replace with Read/Write Files from Disk',
            description: 'Replace this node with Read/Write Files from Disk and select Read File(s) From Disk.',
        },
    ],
});
exports.ReadBinaryFilesRemovedRule = createNodeReplacementRule({
    id: 'read-binary-files-removed',
    removedNodeName: 'Read Binary Files',
    removedNodeType: 'n8n-nodes-base.readBinaryFiles',
    recommendations: [
        {
            action: 'Replace with Read/Write Files from Disk',
            description: 'Replace this node with Read/Write Files from Disk and select Read File(s) From Disk.',
        },
    ],
});
exports.ReadPdfRemovedRule = createNodeReplacementRule({
    id: 'read-pdf-removed',
    removedNodeName: 'Read PDF',
    removedNodeType: 'n8n-nodes-base.readPDF',
    recommendations: [
        {
            action: 'Replace with Extract From File',
            description: 'Replace this node with Extract From File and select Extract From PDF.',
        },
    ],
});
exports.SerpApiGoogleSearchRemovedRule = createNodeReplacementRule({
    id: 'serpapi-google-search-removed',
    removedNodeName: 'SerpApi (Google Search)',
    removedNodeType: '@n8n/n8n-nodes-langchain.toolSerpApi',
    recommendations: [
        {
            action: 'Replace with SerpApi',
            description: 'Replace this node with the verified SerpApi community node and recreate its search settings.',
        },
    ],
});
exports.SupabaseInsertRemovedRule = createNodeReplacementRule({
    id: 'supabase-insert-removed',
    removedNodeName: 'Supabase: Insert',
    removedNodeType: '@n8n/n8n-nodes-langchain.vectorStoreSupabaseInsert',
    recommendations: [
        {
            action: 'Replace with Supabase Vector Store',
            description: 'Replace this node with Supabase Vector Store and select Insert Documents.',
        },
    ],
});
exports.SupabaseLoadRemovedRule = createNodeReplacementRule({
    id: 'supabase-load-removed',
    removedNodeName: 'Supabase: Load',
    removedNodeType: '@n8n/n8n-nodes-langchain.vectorStoreSupabaseLoad',
    recommendations: [
        {
            action: 'Replace with Supabase Vector Store',
            description: 'Replace this node with Supabase Vector Store and select Get Many.',
        },
    ],
});
exports.WorkflowTriggerRemovedRule = createNodeReplacementRule({
    id: 'workflow-trigger-removed',
    removedNodeName: 'Workflow Trigger',
    removedNodeType: 'n8n-nodes-base.workflowTrigger',
    recommendations: [
        {
            action: 'Replace with n8n Trigger',
            description: 'Replace this node with n8n Trigger and recreate its event settings.',
        },
    ],
});
exports.WriteBinaryFileRemovedRule = createNodeReplacementRule({
    id: 'write-binary-file-removed',
    removedNodeName: 'Write Binary File',
    removedNodeType: 'n8n-nodes-base.writeBinaryFile',
    recommendations: [
        {
            action: 'Replace with Read/Write Files from Disk',
            description: 'Replace this node with Read/Write Files from Disk and select Write File to Disk.',
        },
    ],
});
exports.directNodeReplacementRules = [
    {
        rule: exports.BinaryInputLoaderRemovedRule,
        removedNodeType: '@n8n/n8n-nodes-langchain.documentBinaryInputLoader',
    },
    {
        rule: exports.ChatMessagesRetrieverRemovedRule,
        removedNodeType: '@n8n/n8n-nodes-langchain.memoryChatRetriever',
    },
    { rule: exports.ConvertToFromBinaryDataRemovedRule, removedNodeType: 'n8n-nodes-base.moveBinaryData' },
    { rule: exports.CronRemovedRule, removedNodeType: 'n8n-nodes-base.cron' },
    { rule: exports.FunctionRemovedRule, removedNodeType: 'n8n-nodes-base.function' },
    { rule: exports.FunctionItemRemovedRule, removedNodeType: 'n8n-nodes-base.functionItem' },
    { rule: exports.HtmlExtractRemovedRule, removedNodeType: 'n8n-nodes-base.htmlExtract' },
    { rule: exports.HttpRequestToolRemovedRule, removedNodeType: '@n8n/n8n-nodes-langchain.toolHttpRequest' },
    { rule: exports.ICalendarRemovedRule, removedNodeType: 'n8n-nodes-base.iCal' },
    { rule: exports.ItemListsRemovedRule, removedNodeType: 'n8n-nodes-base.itemLists' },
    {
        rule: exports.InMemoryVectorStoreInsertRemovedRule,
        removedNodeType: '@n8n/n8n-nodes-langchain.vectorStoreInMemoryInsert',
    },
    {
        rule: exports.InMemoryVectorStoreLoadRemovedRule,
        removedNodeType: '@n8n/n8n-nodes-langchain.vectorStoreInMemoryLoad',
    },
    { rule: exports.IntervalRemovedRule, removedNodeType: 'n8n-nodes-base.interval' },
    {
        rule: exports.JsonInputLoaderRemovedRule,
        removedNodeType: '@n8n/n8n-nodes-langchain.documentJsonInputLoader',
    },
    {
        rule: exports.ManualChatTriggerRemovedRule,
        removedNodeType: '@n8n/n8n-nodes-langchain.manualChatTrigger',
    },
    { rule: exports.OpenAiAssistantRemovedRule, removedNodeType: '@n8n/n8n-nodes-langchain.openAiAssistant' },
    { rule: exports.OpenAiRemovedRule, removedNodeType: 'n8n-nodes-base.openAi' },
    { rule: exports.OpenAiModelRemovedRule, removedNodeType: '@n8n/n8n-nodes-langchain.lmOpenAi' },
    {
        rule: exports.PineconeInsertRemovedRule,
        removedNodeType: '@n8n/n8n-nodes-langchain.vectorStorePineconeInsert',
    },
    {
        rule: exports.PineconeLoadRemovedRule,
        removedNodeType: '@n8n/n8n-nodes-langchain.vectorStorePineconeLoad',
    },
    { rule: exports.ReadBinaryFileRemovedRule, removedNodeType: 'n8n-nodes-base.readBinaryFile' },
    { rule: exports.ReadBinaryFilesRemovedRule, removedNodeType: 'n8n-nodes-base.readBinaryFiles' },
    { rule: exports.ReadPdfRemovedRule, removedNodeType: 'n8n-nodes-base.readPDF' },
    { rule: exports.SerpApiGoogleSearchRemovedRule, removedNodeType: '@n8n/n8n-nodes-langchain.toolSerpApi' },
    {
        rule: exports.SupabaseInsertRemovedRule,
        removedNodeType: '@n8n/n8n-nodes-langchain.vectorStoreSupabaseInsert',
    },
    {
        rule: exports.SupabaseLoadRemovedRule,
        removedNodeType: '@n8n/n8n-nodes-langchain.vectorStoreSupabaseLoad',
    },
    { rule: exports.WorkflowTriggerRemovedRule, removedNodeType: 'n8n-nodes-base.workflowTrigger' },
    { rule: exports.WriteBinaryFileRemovedRule, removedNodeType: 'n8n-nodes-base.writeBinaryFile' },
];
//# sourceMappingURL=removed-nodes-with-replacements.rule.js.map