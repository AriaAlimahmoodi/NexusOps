"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTopicalAlignmentCheckFn = exports.TOPICAL_ALIGNMENT_SYSTEM_PROMPT = void 0;
const model_1 = require("../../helpers/model");
exports.TOPICAL_ALIGNMENT_SYSTEM_PROMPT = `You are a content analysis system that determines if text stays on topic.

BUSINESS SCOPE: [INSERT BUSINESS SCOPE HERE]

Determine if the text stays within the defined business scope. Flag any content
that strays from the allowed topics.`;
const createTopicalAlignmentCheckFn = (config) => (0, model_1.createLLMCheckFn)('topicalAlignment', config);
exports.createTopicalAlignmentCheckFn = createTopicalAlignmentCheckFn;
//# sourceMappingURL=topicalAlignment.js.map