"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSaveSettings = toSaveSettings;
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
function toSaveSettings(workflowSettings = {}) {
    const DEFAULTS = {
        ERROR: di_1.Container.get(config_1.GlobalConfig).executions.saveDataOnError,
        SUCCESS: di_1.Container.get(config_1.GlobalConfig).executions.saveDataOnSuccess,
        MANUAL: di_1.Container.get(config_1.GlobalConfig).executions.saveDataManualExecutions,
        PROGRESS: di_1.Container.get(config_1.GlobalConfig).executions.saveExecutionProgress,
    };
    const { saveDataErrorExecution = DEFAULTS.ERROR, saveDataSuccessExecution = DEFAULTS.SUCCESS, saveManualExecutions = DEFAULTS.MANUAL, saveExecutionProgress = DEFAULTS.PROGRESS, } = workflowSettings ?? {};
    return {
        error: saveDataErrorExecution === 'DEFAULT' ? DEFAULTS.ERROR : saveDataErrorExecution === 'all',
        success: saveDataSuccessExecution === 'DEFAULT'
            ? DEFAULTS.SUCCESS
            : saveDataSuccessExecution === 'all',
        manual: saveManualExecutions === 'DEFAULT' ? DEFAULTS.MANUAL : saveManualExecutions,
        progress: saveExecutionProgress === 'DEFAULT' ? DEFAULTS.PROGRESS : saveExecutionProgress,
    };
}
//# sourceMappingURL=to-save-settings.js.map