"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateFolderDto = void 0;
const folder_schema_1 = require("../../schemas/folder.schema");
const zod_class_1 = require("../../zod-class");
class CreateFolderDto extends zod_class_1.Z.class({
    name: folder_schema_1.folderNameSchema,
    parentFolderId: folder_schema_1.folderIdSchema.optional(),
}) {
}
exports.CreateFolderDto = CreateFolderDto;
//# sourceMappingURL=create-folder.dto.js.map