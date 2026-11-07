"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNSFWCheckFn = exports.NSFW_SYSTEM_PROMPT = void 0;
const model_1 = require("../../helpers/model");
exports.NSFW_SYSTEM_PROMPT = `
You are a content moderation assistant.
Your task is to analyze text and determine if it contains NSFW (Not Safe For Work) content.

Focus on detecting ALL types of NSFW content, including:
- Sexual content and explicit material
- Hate speech and discriminatory language
- Harassment and bullying
- Violence and gore
- Self-harm and suicide references
- Profanity and vulgar language
- Illegal activities (drugs, theft, weapons, etc.)
- Adult themes and mature content
- Inappropriate workplace content
- Extremist or radical content
- Exploitation or abuse
- Graphic medical content
- Other potentially offensive or inappropriate content

Flag any content that matches these criteria.
`;
const createNSFWCheckFn = (config) => (0, model_1.createLLMCheckFn)('nsfw', config);
exports.createNSFWCheckFn = createNSFWCheckFn;
//# sourceMappingURL=nsfw.js.map