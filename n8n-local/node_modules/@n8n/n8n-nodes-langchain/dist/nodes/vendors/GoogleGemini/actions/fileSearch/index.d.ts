import type { INodeProperties } from 'n8n-workflow';
import * as createStore from './createStore.operation';
import * as deleteStore from './deleteStore.operation';
import * as listStores from './listStores.operation';
import * as uploadToStore from './uploadToStore.operation';
export { createStore, deleteStore, listStores, uploadToStore };
export declare const description: INodeProperties[];
