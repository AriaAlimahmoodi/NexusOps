"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemListsToTransformNodes = void 0;
const item_lists_checks_1 = require("./item-lists-checks");
const item_lists_legacy_1 = require("./item-lists-legacy");
const parameter_readers_1 = require("../parameter-readers");
const TRANSFORM_NODE = (name) => `n8n-nodes-base.${name}`;
const copyParameters = (...keys) => (node) => ({ parameters: (0, parameter_readers_1.pickDefined)(node.parameters, keys) });
const TARGETS = new Map(Object.entries({
    limit: {
        type: TRANSFORM_NODE('limit'),
        typeVersion: 1,
        parameters: ['maxItems', 'keep'],
        legacy: copyParameters('maxItems', 'keep'),
    },
    sort: {
        type: TRANSFORM_NODE('sort'),
        typeVersion: 1,
        parameters: ['type', 'sortFieldsUi', 'code', 'options'],
        legacy: copyParameters('type', 'sortFieldsUi', 'code', 'options'),
    },
    concatenateItems: {
        type: TRANSFORM_NODE('aggregate'),
        typeVersion: 1,
        parameters: [
            'aggregate',
            'fieldsToAggregate',
            'destinationFieldName',
            'include',
            'fieldsToExclude',
            'fieldsToInclude',
            'options',
        ],
        legacy: item_lists_legacy_1.legacyAggregate,
    },
    removeDuplicates: {
        type: TRANSFORM_NODE('removeDuplicates'),
        typeVersion: 1,
        parameters: ['compare', 'fieldsToExclude', 'fieldsToCompare', 'options'],
        legacy: item_lists_legacy_1.legacyRemoveDuplicates,
        check: (node) => {
            if (node.typeVersion >= 3.1) {
                throw new Error('The old node can compare values of different types, such as numbers and text, but the new node stops with an error. Replace this node by hand.');
            }
        },
    },
    splitOutItems: {
        type: TRANSFORM_NODE('splitOut'),
        typeVersion: 1,
        parameters: ['fieldToSplitOut', 'include', 'fieldsToInclude', 'options'],
        legacy: item_lists_legacy_1.legacySplitOut,
        check: item_lists_checks_1.assertNoEmptyFieldToSplitOut,
    },
    summarize: {
        type: TRANSFORM_NODE('summarize'),
        typeVersion: 1.1,
        parameters: ['fieldsToSummarize', 'fieldsToSplitBy', 'options'],
        legacy: item_lists_legacy_1.legacySummarize,
        check: (node) => {
            (0, item_lists_checks_1.assertNoSplitBy)(node);
            (0, item_lists_checks_1.assertIncludeEmptyIsInert)(node);
        },
    },
}));
exports.itemListsToTransformNodes = {
    ruleId: 'item-lists-removed-v3',
    migrate: (node) => {
        const operation = (0, parameter_readers_1.readString)(node.parameters, 'operation', 'splitOutItems', 'Operation');
        const isLegacy = node.typeVersion < 3;
        const target = isLegacy
            ? TARGETS.get(operation === 'aggregateItems' ? 'concatenateItems' : operation)
            : TARGETS.get(operation);
        if (!target || (isLegacy && operation === 'concatenateItems')) {
            throw new Error(`Item Lists operation "${operation}" is not supported.`);
        }
        if (isLegacy) {
            const { typeVersion = target.typeVersion, parameters, notes } = target.legacy(node);
            return { node: { type: target.type, typeVersion, parameters }, notes };
        }
        target.check?.(node);
        const parameters = (0, parameter_readers_1.pickDefined)(node.parameters, target.parameters);
        return { node: { type: target.type, typeVersion: target.typeVersion, parameters } };
    },
};
//# sourceMappingURL=item-lists.migration.js.map