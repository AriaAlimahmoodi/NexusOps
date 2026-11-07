"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NAIVE_FIX_PROMPT = void 0;
exports.NAIVE_FIX_PROMPT = `Instructions:
--------------
{instructions}
--------------
Completion:
--------------
{completion}
--------------

Above, the Completion did not satisfy the constraints given in the Instructions.
Error:
--------------
{error}
--------------

Please try again. Please only respond with an answer that satisfies the constraints laid out in the Instructions:`;
//# sourceMappingURL=prompt.js.map