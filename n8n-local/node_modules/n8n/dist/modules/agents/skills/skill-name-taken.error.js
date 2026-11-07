"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillNameTakenError = void 0;
exports.skillNameTakenToolMessage = skillNameTakenToolMessage;
const api_types_1 = require("@n8n/api-types");
const errors_1 = require("@n8n/errors");
class SkillNameTakenError extends errors_1.ConflictError {
    constructor(skillName) {
        super(api_types_1.SKILL_NAME_TAKEN_MESSAGE);
        this.skillName = skillName;
    }
}
exports.SkillNameTakenError = SkillNameTakenError;
function skillNameTakenToolMessage(skillName) {
    return (`The skill name "${skillName}" is taken by another skill in the same scope, so nothing ` +
        'was saved. Choose a different name and retry.');
}
//# sourceMappingURL=skill-name-taken.error.js.map