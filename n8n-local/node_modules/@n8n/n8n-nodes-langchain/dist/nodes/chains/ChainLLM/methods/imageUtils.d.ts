import { HumanMessage } from '@langchain/core/messages';
import type { IExecuteFunctions, IBinaryData } from 'n8n-workflow';
import { OperationalError } from 'n8n-workflow';
import type { MessageTemplate } from './types';
export declare class UnsupportedMimeTypeError extends OperationalError {
}
export declare function dataUriFromImageData(binaryData: IBinaryData, bufferData: Buffer): string;
export declare function createImageMessage({ context, itemIndex, message, }: {
    context: IExecuteFunctions;
    itemIndex: number;
    message: MessageTemplate;
}): Promise<HumanMessage>;
