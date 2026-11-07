"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsupportedMimeTypeError = void 0;
exports.dataUriFromImageData = dataUriFromImageData;
exports.createImageMessage = createImageMessage;
const messages_1 = require("@langchain/core/messages");
const google_genai_1 = require("@langchain/google-genai");
const ollama_1 = require("@langchain/ollama");
const n8n_workflow_1 = require("n8n-workflow");
class UnsupportedMimeTypeError extends n8n_workflow_1.OperationalError {
}
exports.UnsupportedMimeTypeError = UnsupportedMimeTypeError;
function dataUriFromImageData(binaryData, bufferData) {
    if (!binaryData.mimeType?.startsWith('image/')) {
        throw new UnsupportedMimeTypeError(`${binaryData.mimeType} is not a supported type of binary data. Only images are supported.`);
    }
    return `data:${binaryData.mimeType};base64,${bufferData.toString('base64')}`;
}
async function createImageMessage({ context, itemIndex, message, }) {
    if (message.messageType !== 'imageBinary' && message.messageType !== 'imageUrl') {
        throw new n8n_workflow_1.NodeOperationError(context.getNode(), 'Invalid message type. Only imageBinary and imageUrl are supported');
    }
    const detail = message.imageDetail === 'auto' ? undefined : message.imageDetail;
    if (message.messageType === 'imageUrl' && message.imageUrl) {
        return new messages_1.HumanMessage({
            content: [
                {
                    type: 'image_url',
                    image_url: {
                        url: message.imageUrl,
                        detail,
                    },
                },
            ],
        });
    }
    const binaryDataKey = message.binaryImageDataKey ?? 'data';
    const inputData = context.getInputData()[itemIndex];
    const binaryData = inputData.binary?.[binaryDataKey];
    if (!binaryData) {
        throw new n8n_workflow_1.NodeOperationError(context.getNode(), 'No binary data set.');
    }
    const bufferData = await context.helpers.getBinaryDataBuffer(itemIndex, binaryDataKey);
    const model = (await context.getInputConnectionData(n8n_workflow_1.NodeConnectionTypes.AiLanguageModel, 0));
    try {
        const dataURI = dataUriFromImageData(binaryData, bufferData);
        const directUriModels = [google_genai_1.ChatGoogleGenerativeAI, ollama_1.ChatOllama];
        const imageUrl = directUriModels.some((i) => model instanceof i)
            ? dataURI
            : { url: dataURI, detail };
        return new messages_1.HumanMessage({
            content: [
                {
                    type: 'image_url',
                    image_url: imageUrl,
                },
            ],
        });
    }
    catch (error) {
        if (error instanceof UnsupportedMimeTypeError)
            throw new n8n_workflow_1.NodeOperationError(context.getNode(), error.message);
        throw error;
    }
}
//# sourceMappingURL=imageUtils.js.map