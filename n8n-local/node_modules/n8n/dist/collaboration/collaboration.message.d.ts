import { z } from 'zod';
export type CollaborationMessage = WorkflowOpenedMessage | WorkflowClosedMessage | WriteAccessRequestedMessage | WriteAccessReleaseRequestedMessage | WriteAccessHeartbeatMessage | AgentOpenedMessage | AgentClosedMessage | AgentWriteAccessRequestedMessage | AgentWriteAccessReleaseRequestedMessage | AgentWriteAccessHeartbeatMessage;
export declare const workflowOpenedMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"workflowOpened">;
    workflowId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    type: "workflowOpened";
    workflowId: string;
}, {
    type: "workflowOpened";
    workflowId: string;
}>;
export declare const workflowClosedMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"workflowClosed">;
    workflowId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    type: "workflowClosed";
    workflowId: string;
}, {
    type: "workflowClosed";
    workflowId: string;
}>;
export declare const writeAccessRequestedMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"writeAccessRequested">;
    workflowId: z.ZodString;
    force: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    type: "writeAccessRequested";
    workflowId: string;
    force?: boolean | undefined;
}, {
    type: "writeAccessRequested";
    workflowId: string;
    force?: boolean | undefined;
}>;
export declare const writeAccessReleaseRequestedMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"writeAccessReleaseRequested">;
    workflowId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    type: "writeAccessReleaseRequested";
    workflowId: string;
}, {
    type: "writeAccessReleaseRequested";
    workflowId: string;
}>;
export declare const writeAccessHeartbeatMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"writeAccessHeartbeat">;
    workflowId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    type: "writeAccessHeartbeat";
    workflowId: string;
}, {
    type: "writeAccessHeartbeat";
    workflowId: string;
}>;
export declare const agentOpenedMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"agentOpened">;
    agentId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    type: "agentOpened";
    agentId: string;
}, {
    type: "agentOpened";
    agentId: string;
}>;
export declare const agentClosedMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"agentClosed">;
    agentId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    type: "agentClosed";
    agentId: string;
}, {
    type: "agentClosed";
    agentId: string;
}>;
export declare const agentWriteAccessRequestedMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"agentWriteAccessRequested">;
    agentId: z.ZodString;
    force: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    type: "agentWriteAccessRequested";
    agentId: string;
    force?: boolean | undefined;
}, {
    type: "agentWriteAccessRequested";
    agentId: string;
    force?: boolean | undefined;
}>;
export declare const agentWriteAccessReleaseRequestedMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"agentWriteAccessReleaseRequested">;
    agentId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    type: "agentWriteAccessReleaseRequested";
    agentId: string;
}, {
    type: "agentWriteAccessReleaseRequested";
    agentId: string;
}>;
export declare const agentWriteAccessHeartbeatMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"agentWriteAccessHeartbeat">;
    agentId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    type: "agentWriteAccessHeartbeat";
    agentId: string;
}, {
    type: "agentWriteAccessHeartbeat";
    agentId: string;
}>;
export declare const workflowMessageSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"workflowOpened">;
    workflowId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    type: "workflowOpened";
    workflowId: string;
}, {
    type: "workflowOpened";
    workflowId: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"workflowClosed">;
    workflowId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    type: "workflowClosed";
    workflowId: string;
}, {
    type: "workflowClosed";
    workflowId: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"writeAccessRequested">;
    workflowId: z.ZodString;
    force: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    type: "writeAccessRequested";
    workflowId: string;
    force?: boolean | undefined;
}, {
    type: "writeAccessRequested";
    workflowId: string;
    force?: boolean | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"writeAccessReleaseRequested">;
    workflowId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    type: "writeAccessReleaseRequested";
    workflowId: string;
}, {
    type: "writeAccessReleaseRequested";
    workflowId: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"writeAccessHeartbeat">;
    workflowId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    type: "writeAccessHeartbeat";
    workflowId: string;
}, {
    type: "writeAccessHeartbeat";
    workflowId: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"agentOpened">;
    agentId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    type: "agentOpened";
    agentId: string;
}, {
    type: "agentOpened";
    agentId: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"agentClosed">;
    agentId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    type: "agentClosed";
    agentId: string;
}, {
    type: "agentClosed";
    agentId: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"agentWriteAccessRequested">;
    agentId: z.ZodString;
    force: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    type: "agentWriteAccessRequested";
    agentId: string;
    force?: boolean | undefined;
}, {
    type: "agentWriteAccessRequested";
    agentId: string;
    force?: boolean | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"agentWriteAccessReleaseRequested">;
    agentId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    type: "agentWriteAccessReleaseRequested";
    agentId: string;
}, {
    type: "agentWriteAccessReleaseRequested";
    agentId: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"agentWriteAccessHeartbeat">;
    agentId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    type: "agentWriteAccessHeartbeat";
    agentId: string;
}, {
    type: "agentWriteAccessHeartbeat";
    agentId: string;
}>]>;
export type WorkflowOpenedMessage = z.infer<typeof workflowOpenedMessageSchema>;
export type WorkflowClosedMessage = z.infer<typeof workflowClosedMessageSchema>;
export type WriteAccessRequestedMessage = z.infer<typeof writeAccessRequestedMessageSchema>;
export type WriteAccessReleaseRequestedMessage = z.infer<typeof writeAccessReleaseRequestedMessageSchema>;
export type WriteAccessHeartbeatMessage = z.infer<typeof writeAccessHeartbeatMessageSchema>;
export type AgentOpenedMessage = z.infer<typeof agentOpenedMessageSchema>;
export type AgentClosedMessage = z.infer<typeof agentClosedMessageSchema>;
export type AgentWriteAccessRequestedMessage = z.infer<typeof agentWriteAccessRequestedMessageSchema>;
export type AgentWriteAccessReleaseRequestedMessage = z.infer<typeof agentWriteAccessReleaseRequestedMessageSchema>;
export type AgentWriteAccessHeartbeatMessage = z.infer<typeof agentWriteAccessHeartbeatMessageSchema>;
export type WorkflowMessage = z.infer<typeof workflowMessageSchema>;
export declare const parseWorkflowMessage: (msg: unknown) => Promise<{
    type: "workflowOpened";
    workflowId: string;
} | {
    type: "workflowClosed";
    workflowId: string;
} | {
    type: "writeAccessRequested";
    workflowId: string;
    force?: boolean | undefined;
} | {
    type: "writeAccessReleaseRequested";
    workflowId: string;
} | {
    type: "writeAccessHeartbeat";
    workflowId: string;
} | {
    type: "agentOpened";
    agentId: string;
} | {
    type: "agentClosed";
    agentId: string;
} | {
    type: "agentWriteAccessRequested";
    agentId: string;
    force?: boolean | undefined;
} | {
    type: "agentWriteAccessReleaseRequested";
    agentId: string;
} | {
    type: "agentWriteAccessHeartbeat";
    agentId: string;
}>;
