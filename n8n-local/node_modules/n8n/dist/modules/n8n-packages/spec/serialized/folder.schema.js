"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializedFolderSchema = void 0;
const zod_1 = require("zod");
exports.serializedFolderSchema = zod_1.z
    .object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    parentFolderId: zod_1.z.string().nullable(),
})
    .strict();
//# sourceMappingURL=folder.schema.js.map