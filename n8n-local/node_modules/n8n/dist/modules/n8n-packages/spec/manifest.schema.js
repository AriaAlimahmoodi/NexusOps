"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageManifestSchema = exports.manifestEntrySchema = void 0;
const node_path_1 = __importDefault(require("node:path"));
const zod_1 = require("zod");
const constants_1 = require("./constants");
const requirements_schema_1 = require("./requirements.schema");
exports.manifestEntrySchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string(),
    target: zod_1.z
        .string()
        .min(1)
        .refine((target) => !node_path_1.default.win32.isAbsolute(target) &&
        !target.includes('\\') &&
        target.split('/').every((segment) => !['', '.', '..'].includes(segment)), 'Package target must be a canonical relative path'),
});
function assertNoDuplicateIds(entries, label, ctx) {
    if (!entries)
        return;
    const seen = new Set();
    for (const entry of entries) {
        if (seen.has(entry.id)) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: `Duplicate ${label} id in manifest: ${entry.id}`,
            });
        }
        seen.add(entry.id);
    }
}
exports.packageManifestSchema = zod_1.z
    .object({
    packageFormatVersion: zod_1.z.literal(constants_1.FORMAT_VERSION),
    exportedAt: zod_1.z.string().datetime(),
    sourceN8nVersion: zod_1.z.string().min(1),
    sourceId: zod_1.z.string().min(1),
    workflows: zod_1.z.array(exports.manifestEntrySchema).optional(),
    agents: zod_1.z.array(exports.manifestEntrySchema).optional(),
    folders: zod_1.z.array(exports.manifestEntrySchema).optional(),
    projects: zod_1.z.array(exports.manifestEntrySchema).optional(),
    credentials: zod_1.z.array(exports.manifestEntrySchema).optional(),
    dataTables: zod_1.z.array(exports.manifestEntrySchema).optional(),
    variables: zod_1.z.array(exports.manifestEntrySchema).optional(),
    tags: zod_1.z.array(exports.manifestEntrySchema).optional(),
    requirements: requirements_schema_1.packageRequirementsSchema.optional(),
})
    .superRefine((manifest, ctx) => {
    assertNoDuplicateIds(manifest.workflows, 'workflow', ctx);
    assertNoDuplicateIds(manifest.agents, 'Agent', ctx);
    assertNoDuplicateIds(manifest.folders, 'folder', ctx);
    assertNoDuplicateIds(manifest.projects, 'project', ctx);
    assertNoDuplicateIds(manifest.credentials, 'credential', ctx);
    assertNoDuplicateIds(manifest.dataTables, 'data table', ctx);
    assertNoDuplicateIds(manifest.variables, 'variable', ctx);
    assertNoDuplicateIds(manifest.tags, 'tag', ctx);
});
//# sourceMappingURL=manifest.schema.js.map