import type { INodeProperties } from 'n8n-workflow';
import * as generate from './generate.operation';
import * as transcribe from './transcribe.operation';
import * as translate from './translate.operation';
export { generate, transcribe, translate };
export declare const description: INodeProperties[];
