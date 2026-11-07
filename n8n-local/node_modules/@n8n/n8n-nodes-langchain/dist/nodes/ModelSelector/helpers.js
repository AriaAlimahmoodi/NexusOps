"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numberInputsProperty = void 0;
exports.configuredInputs = configuredInputs;
exports.numberInputsProperty = {
    displayName: 'Number of Inputs',
    name: 'numberInputs',
    type: 'options',
    noDataExpression: true,
    default: 2,
    options: [
        {
            name: '2',
            value: 2,
        },
        {
            name: '3',
            value: 3,
        },
        {
            name: '4',
            value: 4,
        },
        {
            name: '5',
            value: 5,
        },
        {
            name: '6',
            value: 6,
        },
        {
            name: '7',
            value: 7,
        },
        {
            name: '8',
            value: 8,
        },
        {
            name: '9',
            value: 9,
        },
        {
            name: '10',
            value: 10,
        },
    ],
    validateType: 'number',
    description: 'The number of data inputs you want to merge. The node waits for all connected inputs to be executed.',
};
function configuredInputs(parameters) {
    return Array.from({ length: parameters.numberInputs || 2 }, (_, i) => ({
        type: 'ai_languageModel',
        displayName: `Model ${(i + 1).toString()}`,
        required: true,
        maxConnections: 1,
    }));
}
//# sourceMappingURL=helpers.js.map