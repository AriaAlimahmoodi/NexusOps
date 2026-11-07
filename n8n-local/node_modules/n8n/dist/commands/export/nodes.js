"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportNodes = void 0;
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const zod_1 = __importDefault(require("zod"));
const load_nodes_and_credentials_1 = require("../../load-nodes-and-credentials");
const base_command_1 = require("../base-command");
const flagsSchema = zod_1.default.object({
    output: zod_1.default
        .string()
        .default('./nodes.json')
        .describe('Path to the output file for node types JSON'),
});
let ExportNodes = class ExportNodes extends base_command_1.BaseCommand {
    async run() {
        const outputPath = path_1.default.resolve(this.flags.output);
        const outputDir = path_1.default.dirname(outputPath);
        this.logger.info(`Exporting node types to ${outputPath}...`);
        await (0, promises_1.mkdir)(outputDir, { recursive: true });
        const loadNodesAndCredentials = di_1.Container.get(load_nodes_and_credentials_1.LoadNodesAndCredentials);
        const { nodes } = loadNodesAndCredentials.types;
        this.logger.info(`Found ${nodes.length} node types`);
        this.writeNodesJSON(outputPath, nodes);
        this.logger.info(`Successfully exported ${nodes.length} node types to ${outputPath}`);
    }
    writeNodesJSON(filePath, nodes) {
        const stream = (0, fs_1.createWriteStream)(filePath, 'utf-8');
        stream.write('[\n');
        nodes.forEach((entry, index) => {
            stream.write(JSON.stringify(entry));
            if (index !== nodes.length - 1)
                stream.write(',');
            stream.write('\n');
        });
        stream.write(']\n');
        stream.end();
    }
};
exports.ExportNodes = ExportNodes;
exports.ExportNodes = ExportNodes = __decorate([
    (0, decorators_1.Command)({
        name: 'export:nodes',
        description: 'Export all node types to a JSON file',
        examples: ['', '--output=/tmp/nodes.json'],
        flagsSchema,
    })
], ExportNodes);
//# sourceMappingURL=nodes.js.map