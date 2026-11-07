"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectChatArtifacts = collectChatArtifacts;
function collectChatArtifacts(items) {
    const artifacts = [];
    for (const item of items) {
        if (item.type === 'artifact-create') {
            if (!item.command.title) {
                continue;
            }
            artifacts.push({
                title: item.command.title,
                type: item.command.type,
                content: item.command.content,
            });
        }
        else if (item.type === 'artifact-edit') {
            const targetDoc = artifacts.find((doc) => doc.title === item.command.title);
            if (targetDoc) {
                if (item.command.replaceAll) {
                    targetDoc.content = targetDoc.content
                        .split(item.command.oldString)
                        .join(item.command.newString);
                }
                else {
                    targetDoc.content = targetDoc.content.replace(item.command.oldString, item.command.newString);
                }
            }
        }
    }
    return artifacts;
}
//# sourceMappingURL=artifact.js.map