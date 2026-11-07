"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.icalToConvertToFile = void 0;
exports.icalToConvertToFile = {
    ruleId: 'i-calendar-removed-v3',
    migrate: (node) => {
        const { operation: _operation, ...parameters } = node.parameters;
        return {
            node: {
                type: 'n8n-nodes-base.convertToFile',
                typeVersion: 1.1,
                parameters: { ...parameters, operation: 'iCal' },
            },
        };
    },
};
//# sourceMappingURL=ical-to-convert-to-file.migration.js.map