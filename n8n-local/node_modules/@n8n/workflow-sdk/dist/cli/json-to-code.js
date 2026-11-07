"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonToCode = jsonToCode;
const fs_1 = __importDefault(require("fs"));
const codegen_1 = require("../codegen");
const utils_1 = require("./utils");
const parse_workflow_code_1 = require("../codegen/parse-workflow-code");
function jsonToCode(filePath) {
    if (!filePath) {
        console.error('Error: No file path provided');
        console.error('Usage: pnpm json-to-code <path-to-workflow.json>');
        process.exit(1);
    }
    let json;
    try {
        const content = fs_1.default.readFileSync(filePath, 'utf-8');
        json = JSON.parse(content);
    }
    catch (error) {
        console.error('Failed to read or parse JSON file:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
    let code;
    try {
        code = (0, codegen_1.generateWorkflowCode)(json);
    }
    catch (error) {
        console.error('Failed to generate code:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
    let builder;
    try {
        builder = (0, parse_workflow_code_1.parseWorkflowCodeToBuilder)(code);
    }
    catch (error) {
        console.error('Failed to parse generated code:', error instanceof Error ? error.message : error);
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
    const outputPath = (0, utils_1.generateOutputPath)(filePath, '.ts');
    fs_1.default.writeFileSync(outputPath, code);
    console.log(`Generated: ${outputPath}`);
}
//# sourceMappingURL=json-to-code.js.map