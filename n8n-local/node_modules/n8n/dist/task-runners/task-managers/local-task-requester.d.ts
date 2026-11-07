import { EventService } from '@n8n/backend-services';
import { GlobalConfig, TaskRunnersConfig } from '@n8n/config';
import type { RequesterMessage } from '@n8n/task-runner';
import { ErrorReporter } from 'n8n-core';
import { NodeTypes } from '../../node-types';
import { TaskBroker } from '../../task-runners/task-broker/task-broker.service';
import { TaskRequester } from './task-requester';
export declare class LocalTaskRequester extends TaskRequester {
    taskBroker: TaskBroker;
    id: string;
    constructor(nodeTypes: NodeTypes, eventService: EventService, taskRunnersConfig: TaskRunnersConfig, globalConfig: GlobalConfig, errorReporter: ErrorReporter);
    registerRequester(): void;
    sendMessage(message: RequesterMessage.ToBroker.All): void;
}
