import { Logger } from '@n8n/backend-common';
import { GlobalConfig, TaskRunnersConfig } from '@n8n/config';
import type { BrokerMessage, RequesterMessage, RunnerMessage, TaskResultData } from '@n8n/task-runner';
import { TaskDeferredError } from '../../task-runners/task-broker/errors/task-deferred.error';
import { TaskRejectError } from '../../task-runners/task-broker/errors/task-reject.error';
import { TaskRunnerLifecycleEvents } from '../../task-runners/task-runner-lifecycle-events';
export interface TaskRunner {
    id: string;
    name?: string;
    taskTypes: string[];
    lastSeen: Date;
}
export interface Task {
    id: string;
    runnerId: TaskRunner['id'];
    requesterId: string;
    taskType: string;
    timeout?: NodeJS.Timeout;
    timesOutAt?: number;
}
export interface TaskOffer {
    offerId: string;
    runnerId: TaskRunner['id'];
    taskType: string;
    validFor: number;
    validUntil: bigint;
}
export interface TaskRequest {
    requestId: string;
    requesterId: string;
    taskType: string;
    timeout?: NodeJS.Timeout;
    acceptInProgress?: boolean;
    timeoutRefreshes?: number;
}
export type MessageCallback = (message: BrokerMessage.ToRunner.All) => Promise<void> | void;
export type RequesterMessageCallback = (message: BrokerMessage.ToRequester.All) => Promise<void> | void;
type RunnerAcceptCallback = () => void;
type RequesterAcceptCallback = (settings: RequesterMessage.ToBroker.TaskSettings['settings']) => void;
type TaskRejectCallback = (reason: TaskRejectError | TaskDeferredError) => void;
export type RunnerReachabilityCheck = () => boolean;
export declare class TaskBroker {
    private readonly logger;
    private readonly taskRunnersConfig;
    private readonly taskRunnerLifecycleEvents;
    private readonly globalConfig;
    private knownRunners;
    private requesters;
    private tasks;
    private isDraining;
    private shutdownDeadline?;
    private runnerAcceptRejects;
    private requesterAcceptRejects;
    private consecutiveAcceptTimeouts;
    private silentRunnersSince;
    private pendingTaskOffers;
    private pendingTaskRequests;
    private requestTimesOutAt;
    private mismatchWarned;
    constructor(logger: Logger, taskRunnersConfig: TaskRunnersConfig, taskRunnerLifecycleEvents: TaskRunnerLifecycleEvents, globalConfig: GlobalConfig);
    private createRequestTimeout;
    private refreshRequestTimeout;
    private handleRequestTimeout;
    private discardOffers;
    expireTasks(): void;
    private discardOffersFrom;
    private discardOffersFromUnreachableRunners;
    registerRunner(runner: TaskRunner, messageCallback: MessageCallback, isRunnerReachable?: RunnerReachabilityCheck): void;
    deregisterRunner(runnerId: string, error: Error): void;
    getInFlightTaskIds(runnerId: TaskRunner['id']): Array<Task['id']>;
    failTasks(taskIds: Array<Task['id']>, error: Error): void;
    registerRequester(requesterId: string, messageCallback: RequesterMessageCallback): void;
    deregisterRequester(requesterId: string): void;
    private messageRunner;
    private messageRequester;
    onRunnerMessage(runnerId: TaskRunner['id'], message: RunnerMessage.ToBroker.All): Promise<void>;
    handleRpcRequest(taskId: Task['id'], callId: string, name: RunnerMessage.ToBroker.RPC['name'], params: unknown[]): Promise<void>;
    handleRunnerAccept(taskId: Task['id']): void;
    handleRunnerReject(taskId: Task['id'], reason: string): void;
    handleRunnerDeferred(taskId: Task['id']): void;
    handleDataRequest(taskId: Task['id'], requestId: RunnerMessage.ToBroker.TaskDataRequest['requestId'], requestParams: RunnerMessage.ToBroker.TaskDataRequest['requestParams']): Promise<void>;
    handleNodeTypesRequest(taskId: Task['id'], requestId: RunnerMessage.ToBroker.NodeTypesRequest['requestId'], requestParams: RunnerMessage.ToBroker.NodeTypesRequest['requestParams']): Promise<void>;
    handleResponse(taskId: Task['id'], requestId: RunnerMessage.ToBroker.TaskDataRequest['requestId'], data: unknown): Promise<void>;
    onRequesterMessage(requesterId: string, message: RequesterMessage.ToBroker.All): Promise<void>;
    handleRequesterRpcResponse(taskId: string, callId: string, status: RequesterMessage.ToBroker.RPCResponse['status'], data: unknown): Promise<void>;
    handleRequesterDataResponse(taskId: Task['id'], requestId: string, data: unknown): Promise<void>;
    handleRequesterNodeTypesResponse(taskId: Task['id'], requestId: RequesterMessage.ToBroker.NodeTypesResponse['requestId'], nodeTypes: RequesterMessage.ToBroker.NodeTypesResponse['nodeTypes']): Promise<void>;
    handleRequesterAccept(taskId: Task['id'], settings: RequesterMessage.ToBroker.TaskSettings['settings']): void;
    handleRequesterReject(taskId: Task['id'], reason: string): void;
    private untrackTask;
    private cancelTask;
    private failTask;
    private getRunnerOrFailTask;
    sendTaskSettings(taskId: Task['id'], settings: unknown): Promise<void>;
    private handleTaskTimeout;
    taskDoneHandler(taskId: Task['id'], data: TaskResultData): Promise<void>;
    taskErrorHandler(taskId: Task['id'], error: unknown): Promise<void>;
    acceptOffer(offer: TaskOffer, request: TaskRequest): Promise<void>;
    private resetAcceptTimeoutsOnOwnTask;
    private flagRunnerIfUnresponsive;
    private flagSilentRunners;
    private reportUnresponsive;
    private monotonicNowMs;
    private isSilent;
    settleTasks(): void;
    private warnOnTaskTypeMismatch;
    taskRequested(request: TaskRequest): void;
    taskOffered(offer: TaskOffer): void;
    startDraining(): void;
    hasActiveTasks(): boolean;
    capTaskTimeoutsForShutdown(deadline: number): void;
    private capRequestTimeoutsForShutdown;
    stopDraining(): void;
    getTasks(): Map<string, Task>;
    getPendingTaskOffers(): TaskOffer[];
    getPendingTaskRequests(): TaskRequest[];
    getKnownRunners(): Map<string, {
        runner: TaskRunner;
        messageCallback: MessageCallback;
        isRunnerReachable: RunnerReachabilityCheck;
    }>;
    getKnownRequesters(): Map<string, RequesterMessageCallback>;
    getRunnerAcceptRejects(): Map<string, {
        accept: RunnerAcceptCallback;
        reject: TaskRejectCallback;
        runnerId: TaskRunner['id'];
    }>;
    getRequesterAcceptRejects(): Map<string, {
        accept: RequesterAcceptCallback;
        reject: TaskRejectCallback;
    }>;
    setTasks(tasks: Record<string, Task>): void;
    setPendingTaskOffers(pendingTaskOffers: TaskOffer[]): void;
    setPendingTaskRequests(pendingTaskRequests: TaskRequest[]): void;
    setRunnerAcceptRejects(runnerAcceptRejects: Record<string, {
        accept: RunnerAcceptCallback;
        reject: TaskRejectCallback;
        runnerId: TaskRunner['id'];
    }>): void;
}
export {};
