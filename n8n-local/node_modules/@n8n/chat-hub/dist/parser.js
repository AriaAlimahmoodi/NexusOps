"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendChunkToParsedMessageItems = appendChunkToParsedMessageItems;
exports.parseMessage = parseMessage;
const api_types_1 = require("@n8n/api-types");
function appendChunkToParsedMessageItems(items, chunk) {
    const result = [...items];
    let remaining = chunk;
    if (result.length > 0) {
        const lastItem = result[result.length - 1];
        if (lastItem.type === 'hidden') {
            remaining = lastItem.content + chunk;
            result.pop();
        }
        else if ((lastItem.type === 'artifact-create' || lastItem.type === 'artifact-edit') &&
            lastItem.isIncomplete) {
            remaining = lastItem.content + chunk;
            result.pop();
        }
    }
    const buttonChunk = tryParseButtonsJson(remaining);
    if (buttonChunk) {
        result.push(buttonChunk);
        return result;
    }
    let currentPos = 0;
    const createCommandRegex = /<command:artifact-create>/g;
    const editCommandRegex = /<command:artifact-edit>/g;
    while (currentPos < remaining.length) {
        createCommandRegex.lastIndex = currentPos;
        editCommandRegex.lastIndex = currentPos;
        const createMatch = createCommandRegex.exec(remaining);
        const editMatch = editCommandRegex.exec(remaining);
        let nextMatch = null;
        let commandType = null;
        if (createMatch && editMatch) {
            if (createMatch.index < editMatch.index) {
                nextMatch = createMatch;
                commandType = 'create';
            }
            else {
                nextMatch = editMatch;
                commandType = 'edit';
            }
        }
        else if (createMatch) {
            nextMatch = createMatch;
            commandType = 'create';
        }
        else if (editMatch) {
            nextMatch = editMatch;
            commandType = 'edit';
        }
        if (!nextMatch || !commandType) {
            const textContent = remaining.slice(currentPos);
            if (textContent) {
                const { text, hiddenPrefix } = splitPotentialCommandPrefix(textContent);
                if (text) {
                    addTextToResult(result, text);
                }
                if (hiddenPrefix) {
                    result.push({ type: 'hidden', content: hiddenPrefix });
                }
            }
            break;
        }
        if (nextMatch.index > currentPos) {
            const textContent = remaining.slice(currentPos, nextMatch.index);
            addTextToResult(result, textContent);
        }
        const commandStart = nextMatch.index;
        const commandContent = remaining.slice(commandStart);
        if (commandType === 'create') {
            const parsed = parseArtifactCreateCommand(commandContent);
            result.push(parsed.item);
            currentPos = commandStart + parsed.consumed;
        }
        else {
            const parsed = parseArtifactEditCommand(commandContent);
            result.push(parsed.item);
            currentPos = commandStart + parsed.consumed;
        }
    }
    return result;
}
function addTextToResult(result, textContent) {
    if (textContent === '') {
        return;
    }
    if (result.length > 0) {
        const lastItem = result[result.length - 1];
        if (lastItem.type === 'text') {
            result[result.length - 1] = { type: 'text', content: lastItem.content + textContent };
            return;
        }
    }
    result.push({ type: 'text', content: textContent });
}
function splitPotentialCommandPrefix(text) {
    const commandTags = ['<command:artifact-create>', '<command:artifact-edit>'];
    for (let len = 1; len <= Math.min(text.length, 30); len++) {
        const suffix = text.slice(-len);
        for (const tag of commandTags) {
            if (tag.startsWith(suffix)) {
                return {
                    text: text.slice(0, -len),
                    hiddenPrefix: suffix,
                };
            }
        }
    }
    return { text, hiddenPrefix: '' };
}
function parseArtifactCreateCommand(content) {
    const closingTag = '</command:artifact-create>';
    const closingIndex = content.indexOf(closingTag);
    const isIncomplete = closingIndex === -1;
    const commandContent = isIncomplete
        ? content
        : content.slice(0, closingIndex + closingTag.length);
    const title = extractTagContent(commandContent, 'title') ?? '';
    const type = extractTagContent(commandContent, 'type') ?? '';
    const contentField = extractTagContent(commandContent, 'content') ?? '';
    return {
        item: {
            type: 'artifact-create',
            content: commandContent,
            command: { title, type, content: contentField },
            isIncomplete,
        },
        consumed: commandContent.length,
    };
}
function parseArtifactEditCommand(content) {
    const closingTag = '</command:artifact-edit>';
    const closingIndex = content.indexOf(closingTag);
    const isIncomplete = closingIndex === -1;
    const commandContent = isIncomplete
        ? content
        : content.slice(0, closingIndex + closingTag.length);
    const title = extractTagContent(commandContent, 'title') ?? '';
    const oldString = extractTagContent(commandContent, 'oldString') ?? '';
    const newString = extractTagContent(commandContent, 'newString') ?? '';
    const replaceAllStr = extractTagContent(commandContent, 'replaceAll') ?? 'false';
    const replaceAll = replaceAllStr.toLowerCase() === 'true';
    return {
        item: {
            type: 'artifact-edit',
            content: commandContent,
            command: { title, oldString, newString, replaceAll },
            isIncomplete,
        },
        consumed: commandContent.length,
    };
}
function extractTagContent(xml, tagName) {
    const openTag = `<${tagName}>`;
    const closeTag = `</${tagName}>`;
    const startIndex = xml.indexOf(openTag);
    if (startIndex === -1) {
        return null;
    }
    const contentStart = startIndex + openTag.length;
    const endIndex = xml.indexOf(closeTag, contentStart);
    if (endIndex === -1) {
        let content = xml.slice(contentStart);
        for (let len = 1; len < closeTag.length; len++) {
            const partialCloseTag = closeTag.slice(0, len);
            if (content.endsWith(partialCloseTag)) {
                content = content.slice(0, -len);
                break;
            }
        }
        return content.length > 0 ? content : null;
    }
    return xml.slice(contentStart, endIndex);
}
function tryParseButtonsJson(content) {
    if (!content.startsWith('{'))
        return null;
    try {
        const parsed = JSON.parse(content);
        const result = api_types_1.chatHubMessageWithButtonsSchema.safeParse(parsed);
        if (result.success) {
            return {
                type: 'with-buttons',
                content: result.data.text,
                buttons: result.data.buttons,
                blockUserInput: result.data.blockUserInput,
            };
        }
    }
    catch {
    }
    return null;
}
function parseMessage(message) {
    if (message.type !== 'ai') {
        return [{ type: 'text', content: message.content }];
    }
    return appendChunkToParsedMessageItems([], message.content);
}
//# sourceMappingURL=parser.js.map