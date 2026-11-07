"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const n8n_workflow_1 = require("n8n-workflow");
const utilities_1 = require("../../../../../utils/utilities");
const utils_1 = require("../../helpers/utils");
const common_descriptions_1 = require("../common.descriptions");
const properties = [
    {
        displayName: 'Return All',
        name: 'returnAll',
        type: 'boolean',
        default: false,
        description: 'Whether to return all results or only up to a given limit',
        displayOptions: {
            show: {
                resource: ['event'],
                operation: ['getAll'],
            },
        },
    },
    {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        default: 50,
        description: 'Max number of results to return',
        typeOptions: {
            minValue: 1,
        },
        displayOptions: {
            show: {
                returnAll: [false],
            },
        },
    },
    common_descriptions_1.whereFixedCollection,
    common_descriptions_1.combineConditionsCollection,
    common_descriptions_1.sortFixedCollection,
    common_descriptions_1.optionsCollection,
];
const displayOptions = {
    show: {
        resource: ['database'],
        operation: ['select'],
    },
    hide: {
        table: [''],
    },
};
exports.description = (0, utilities_1.updateDisplayOptions)(displayOptions, properties);
async function execute(runQueries, items, nodeOptions, _db) {
    items = (0, utils_1.replaceEmptyStringsByNulls)(items, nodeOptions.replaceEmptyStrings);
    const queries = [];
    for (let i = 0; i < items.length; i++) {
        const schema = this.getNodeParameter('schema', i, undefined, {
            extractValue: true,
        });
        const table = this.getNodeParameter('table', i, undefined, {
            extractValue: true,
        });
        let values = [schema, table];
        const outputColumns = this.getNodeParameter('options.outputColumns', i, ['*']);
        let query = '';
        if (outputColumns.includes('*')) {
            query = 'SELECT * FROM $1:name.$2:name';
        }
        else {
            values.push(outputColumns);
            query = `SELECT $${values.length}:name FROM $1:name.$2:name`;
        }
        const whereClauses = (0, utils_1.getWhereClauses)(this, i);
        const combineConditions = this.getNodeParameter('combineConditions', i, 'AND');
        [query, values] = (0, utils_1.addWhereClauses)(this.getNode(), i, query, whereClauses, values, combineConditions);
        const sortRules = this.getNodeParameter('sort', i, []).values || [];
        [query, values] = (0, utils_1.addSortRules)(query, sortRules, values);
        const returnAll = this.getNodeParameter('returnAll', i, false);
        if (!returnAll) {
            const limitRaw = this.getNodeParameter('limit', i, 50);
            const limit = (0, n8n_workflow_1.tryToParseNumber)(limitRaw);
            values.push(limit);
            query += ` LIMIT $${values.length}`;
        }
        const queryWithValues = { query, values };
        queries.push(queryWithValues);
    }
    return await runQueries(queries, nodeOptions);
}
//# sourceMappingURL=select.operation.js.map