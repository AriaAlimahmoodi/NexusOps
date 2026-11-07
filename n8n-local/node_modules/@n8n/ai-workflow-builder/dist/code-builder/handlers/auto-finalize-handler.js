"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoFinalizeHandler = void 0;
const constants_1 = require("../constants");
const content_extractors_1 = require("../utils/content-extractors");
const format_warnings_1 = require("../utils/format-warnings");
class AutoFinalizeHandler {
    parseAndValidate;
    getErrorContext;
    constructor(config) {
        this.parseAndValidate = config.parseAndValidate;
        this.getErrorContext = config.getErrorContext;
    }
    async *execute(params) {
        const { code, currentWorkflow, messages, warningTracker } = params;
        const parseStartTime = Date.now();
        try {
            const result = await this.parseAndValidate(code, currentWorkflow);
            const parseDuration = Date.now() - parseStartTime;
            if (result.warnings.length > 0) {
                const newWarnings = warningTracker
                    ? warningTracker.filterNewWarnings(result.warnings)
                    : result.warnings;
                if (newWarnings.length > 0) {
                    if (warningTracker) {
                        warningTracker.markAsSeen(newWarnings);
                    }
                    const warningText = (0, format_warnings_1.formatWarnings)(newWarnings, warningTracker);
                    const errorContext = this.getErrorContext(code, newWarnings[0].message);
                    (0, content_extractors_1.pushValidationFeedback)(messages, `Validation warnings:\n${warningText}\n\n${errorContext}\n\n${constants_1.FIX_VALIDATION_ERRORS_INSTRUCTION}`);
                    return { success: false, parseDuration };
                }
            }
            return {
                success: true,
                workflow: result.workflow,
                parseDuration,
            };
        }
        catch (error) {
            const parseDuration = Date.now() - parseStartTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorContext = this.getErrorContext(code, errorMessage);
            (0, content_extractors_1.pushValidationFeedback)(messages, `Parse error: ${errorMessage}\n\n${errorContext}\n\n${constants_1.FIX_VALIDATION_ERRORS_INSTRUCTION}`);
            return { success: false, parseDuration };
        }
    }
}
exports.AutoFinalizeHandler = AutoFinalizeHandler;
//# sourceMappingURL=auto-finalize-handler.js.map