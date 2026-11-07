"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinalResponseHandler = void 0;
const content_extractors_1 = require("../utils/content-extractors");
const extract_code_1 = require("../utils/extract-code");
const format_warnings_1 = require("../utils/format-warnings");
class FinalResponseHandler {
    parseAndValidate;
    constructor(config) {
        this.parseAndValidate = config.parseAndValidate;
    }
    async process(params) {
        const { response, currentWorkflow, messages, warningTracker } = params;
        const parseResult = this.parseStructuredOutput(response);
        if (!parseResult.result) {
            (0, content_extractors_1.pushValidationFeedback)(messages, `Could not parse your response: ${parseResult.error}\n\nPlease provide your workflow code in a \`\`\`typescript code block.`);
            return {
                success: false,
                isParseError: true,
                shouldContinue: true,
            };
        }
        const workflowCode = parseResult.result.workflowCode;
        const parseStartTime = Date.now();
        try {
            const result = await this.parseAndValidate(workflowCode, currentWorkflow);
            const parseDuration = Date.now() - parseStartTime;
            const newWarnings = warningTracker.filterNewWarnings(result.warnings);
            if (newWarnings.length > 0) {
                warningTracker.markAsSeen(newWarnings);
                const warningMessages = (0, format_warnings_1.formatWarnings)(newWarnings.slice(0, 5), warningTracker);
                (0, content_extractors_1.pushValidationFeedback)(messages, `The workflow code has validation warnings that should be addressed:\n\n${warningMessages}\n\nPlease fix these issues and provide the corrected version in a \`\`\`typescript code block.`);
                return {
                    success: false,
                    parseDuration,
                    shouldContinue: true,
                };
            }
            return {
                success: true,
                workflow: result.workflow,
                sourceCode: workflowCode,
                parseDuration,
                shouldContinue: false,
            };
        }
        catch (parseError) {
            const parseDuration = Date.now() - parseStartTime;
            const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
            (0, content_extractors_1.pushValidationFeedback)(messages, `The workflow code you generated has a parsing error:\n\n${errorMessage}\n\nPlease fix the code and provide the corrected version in a \`\`\`typescript code block.`);
            return {
                success: false,
                parseDuration,
                isParseError: true,
                shouldContinue: true,
            };
        }
    }
    parseStructuredOutput(message) {
        const content = (0, content_extractors_1.extractTextContent)(message);
        if (!content) {
            return { result: null, error: 'No text content found in response' };
        }
        const workflowCode = (0, extract_code_1.extractWorkflowCode)(content);
        if (!workflowCode?.includes('workflow')) {
            return {
                result: null,
                error: 'No valid workflow code found in response. Please provide your code in a ```typescript code block.',
            };
        }
        return { result: { workflowCode }, error: null };
    }
}
exports.FinalResponseHandler = FinalResponseHandler;
//# sourceMappingURL=final-response-handler.js.map