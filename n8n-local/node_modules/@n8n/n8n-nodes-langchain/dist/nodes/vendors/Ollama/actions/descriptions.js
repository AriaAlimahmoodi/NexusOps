"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelRLC = void 0;
exports.modelRLC = {
    displayName: 'Model',
    name: 'modelId',
    type: 'resourceLocator',
    default: { mode: 'list', value: '' },
    required: true,
    modes: [
        {
            displayName: 'From List',
            name: 'list',
            type: 'list',
            typeOptions: {
                searchListMethod: 'modelSearch',
                searchable: true,
            },
        },
        {
            displayName: 'ID',
            name: 'id',
            type: 'string',
            placeholder: 'e.g. llava, llama3.2-vision',
        },
    ],
};
//# sourceMappingURL=descriptions.js.map