import type { INodeProperties } from 'n8n-workflow';
import * as analyze from './analyze.operation';
import * as generate from './generate.operation';
import * as edit from './edit.operation';
export { generate, analyze, edit };
export declare const description: INodeProperties[];
