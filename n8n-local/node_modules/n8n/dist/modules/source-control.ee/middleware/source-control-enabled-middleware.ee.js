"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sourceControlEnabledMiddleware = void 0;
const di_1 = require("@n8n/di");
const source_control_preferences_service_ee_1 = require("../source-control-preferences.service.ee");
const sourceControlEnabledMiddleware = (_req, res, next) => {
    const sourceControlPreferencesService = di_1.Container.get(source_control_preferences_service_ee_1.SourceControlPreferencesService);
    if (sourceControlPreferencesService.isSourceControlConnected()) {
        next();
    }
    else {
        res.status(412).json({
            status: 'error',
            message: 'source_control_not_connected',
        });
    }
};
exports.sourceControlEnabledMiddleware = sourceControlEnabledMiddleware;
//# sourceMappingURL=source-control-enabled-middleware.ee.js.map