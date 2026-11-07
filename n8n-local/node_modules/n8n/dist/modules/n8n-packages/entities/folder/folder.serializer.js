"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderSerializer = void 0;
const di_1 = require("@n8n/di");
const folder_schema_1 = require("../../spec/serialized/folder.schema");
const package_serialization_types_1 = require("../package-serialization.types");
const serializePayload = (0, package_serialization_types_1.definePackageSerializationPayload)();
let FolderSerializer = class FolderSerializer {
    serialize(folder, parentFolderId) {
        return folder_schema_1.serializedFolderSchema.parse(serializePayload({
            id: folder.id,
            name: folder.name,
            parentFolderId,
        }));
    }
};
exports.FolderSerializer = FolderSerializer;
exports.FolderSerializer = FolderSerializer = __decorate([
    (0, di_1.Service)()
], FolderSerializer);
//# sourceMappingURL=folder.serializer.js.map