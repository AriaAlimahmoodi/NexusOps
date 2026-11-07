import type { INodeProperties } from 'n8n-workflow';
import * as create from './create.operation';
import * as deleteAssistant from './deleteAssistant.operation';
import * as list from './list.operation';
import * as message from './message.operation';
import * as update from './update.operation';
export { create, deleteAssistant, message, list, update };
export declare const description: INodeProperties[];
