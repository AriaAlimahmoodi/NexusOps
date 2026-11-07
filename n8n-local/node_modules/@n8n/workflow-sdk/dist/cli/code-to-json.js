"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeToJson = codeToJson;
const fs_1 = __importDefault(require("fs"));
const utils_1 = require("./utils");
const parse_workflow_code_1 = require("../codegen/parse-workflow-code");
function codeToJson(filePath) {
    if (!filePath) {
        console.error('Error: No file path provided');
        console.error('Usage: pnpm code-to-json <path-to-workflow.ts>');
        process.exit(1);
    }
    let code;
    try {
        code = fs_1.default.readFileSync(filePath, 'utf-8');
    }
    catch (error) {
        console.error('Failed to read file:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
    let builder;
    try {
        builder = (0, parse_workflow_code_1.parseWorkflowCodeToBuilder)(code);
    }
    catch (error) {
        console.error('Failed to parse code:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
    const validation = builder.validate();
    if (validation.errors.length > 0) {
        console.error('Validation errors:');
        for (const error of validation.errors) {
            console.error(`  - ${error.message}`);
        }
        process.exit(1);
    }
    if (validation.warnings.length > 0) {
        console.warn('Validation warnings:');
        for (const warning of validation.warnings) {
            console.warn(`  - ${warning.message}`);
        }
    }
    const json = builder.toJSON();
    const outputPath = (0, utils_1.generateOutputPath)(filePath, '.json');
    fs_1.default.writeFileSync(outputPath, JSON.stringify(json, null, 2));
    console.log(`Generated: ${outputPath}`);
}
//# sourceMappingURL=code-to-json.js.map