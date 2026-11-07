"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PROMPT_TEMPLATE = exports.REFINE_PROMPT_TEMPLATE = void 0;
exports.REFINE_PROMPT_TEMPLATE = `Your job is to produce a final summary
We have provided an existing summary up to a certain point: "{existing_answer}"
We have the opportunity to refine the existing summary
(only if needed) with some more context below.
------------
"{text}"
------------

Given the new context, refine the original summary
If the context isn't useful, return the original summary.

REFINED SUMMARY:`;
exports.DEFAULT_PROMPT_TEMPLATE = `Write a concise summary of the following:


"{text}"


CONCISE SUMMARY:`;
//# sourceMappingURL=prompt.js.map