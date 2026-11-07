"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applySkillInstructionEdits = applySkillInstructionEdits;
const n8n_workflow_1 = require("n8n-workflow");
function applySkillInstructionEdits(instructions, edits) {
    return edits.reduce((text, { oldText, newText }, index) => {
        const count = text.split(oldText).length - 1;
        if (count !== 1) {
            throw new n8n_workflow_1.UserError(`instructionEdits[${index}]: oldText matches ${count} places; it must match exactly one. ` +
                'No edits were saved.');
        }
        return text.replace(oldText, () => newText);
    }, instructions);
}
//# sourceMappingURL=skill-instruction-edits.js.map