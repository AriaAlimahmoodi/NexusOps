import type { INodeProperties } from 'n8n-workflow';
import * as deleteFile from './deleteFile.operation';
import * as list from './list.operation';
import * as upload from './upload.operation';
export { upload, deleteFile, list };
export declare const description: INodeProperties[];
