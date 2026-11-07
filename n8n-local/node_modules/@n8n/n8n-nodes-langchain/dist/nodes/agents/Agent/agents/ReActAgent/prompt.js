"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HUMAN_MESSAGE_TEMPLATE = exports.SUFFIX = exports.SUFFIX_CHAT = exports.PREFIX = void 0;
exports.PREFIX = 'Answer the following questions as best you can. You have access to the following tools:';
exports.SUFFIX_CHAT = 'Begin! Reminder to always use the exact characters `Final Answer` when responding.';
exports.SUFFIX = `Begin!

	Question: {input}
	Thought:{agent_scratchpad}`;
exports.HUMAN_MESSAGE_TEMPLATE = '{input}\n\n{agent_scratchpad}';
//# sourceMappingURL=prompt.js.map