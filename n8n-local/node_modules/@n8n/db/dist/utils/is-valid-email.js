"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidEmail = isValidEmail;
const zod_1 = require("zod");
function isValidEmail(email) {
    return zod_1.z.string().email().safeParse(email).success;
}
//# sourceMappingURL=is-valid-email.js.map