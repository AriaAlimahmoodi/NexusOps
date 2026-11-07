"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.legacyAggregate = legacyAggregate;
exports.legacyRemoveDuplicates = legacyRemoveDuplicates;
exports.legacySplitOut = legacySplitOut;
exports.legacySummarize = legacySummarize;
const item_lists_checks_1 = require("./item-lists-checks");
const parameter_readers_1 = require("../parameter-readers");
const MISSING_FIELD_NOTE = 'This node used to stop with an error when a field was missing in all items. The new node continues. Check the workflow if it relies on that error.';
function canStopForMissingField(node, options) {
    return node.typeVersion < 2.1 && options.keepMissing !== true;
}
function splitOutNote(typeVersion) {
    if (typeVersion >= 2.2)
        return undefined;
    const cause = typeVersion < 2.1
        ? 'the field was missing, or when its value was not a list or an object'
        : 'the value of the field was not a list or an object';
    return [
        `This node used to stop with an error when ${cause}. The new node continues. Check the workflow if it relies on that error.`,
    ];
}
const unreadable = (label) => new Error(`"${label}" could not be read. Open the node, check this field and migrate again.`);
function readChoice(parameters, key, fallback, label, allowed) {
    const value = (0, parameter_readers_1.readString)(parameters, key, fallback, label);
    if (!allowed.includes(value)) {
        throw new Error(`"${label}" has an unsupported value. Replace this node by hand.`);
    }
    return value;
}
function readOptions(node, keys) {
    const { options } = node.parameters;
    if (options === undefined)
        return {};
    const parsed = (0, parameter_readers_1.asParameters)(options);
    if (!parsed)
        throw new Error('The options of this node are not in a supported format.');
    return (0, parameter_readers_1.pickDefined)(parsed, keys);
}
const withOptions = (options) => Object.keys(options).length > 0 ? { options } : {};
function readFieldNames(value, label, { trim = false } = {}) {
    if (value === undefined)
        return [];
    const list = (0, parameter_readers_1.asParameters)(value)?.fields;
    if (list === undefined)
        return [];
    if (!Array.isArray(list))
        throw unreadable(label);
    const names = [];
    for (const entry of list) {
        const name = (0, parameter_readers_1.asParameters)(entry)?.fieldName;
        if (name === undefined) {
            throw new Error(`"${label}" has an empty field name. Remove it or replace this node by hand.`);
        }
        if (typeof name !== 'string')
            throw unreadable(label);
        if ((0, parameter_readers_1.isExpression)(name)) {
            throw new Error(`"${label}" has a field name that is an expression. Replace this node by hand.`);
        }
        if (name.includes(',')) {
            throw new Error(`"${label}" has the field name "${name}" with a comma. The new node would split it into two names. Replace this node by hand.`);
        }
        if (trim) {
            if (name.trim() !== '')
                names.push(name.trim());
            continue;
        }
        if (name === '') {
            throw new Error(`"${label}" has an empty field name. Remove it or replace this node by hand.`);
        }
        if (name !== name.trim()) {
            throw new Error(`"${label}" has the field name "${name}" with a space at the start or end. The new node removes it, so the name would change. Replace this node by hand.`);
        }
        names.push(name);
    }
    return names;
}
function assertPlainName(value, label, { allowEmpty = false } = {}) {
    if ((0, parameter_readers_1.isExpression)(value)) {
        throw new Error(`"${label}" is an expression, and the migration cannot check it. Replace this node by hand.`);
    }
    if (value.includes(',') || value !== value.trim() || (value === '' && !allowEmpty)) {
        throw new Error(`"${label}" is empty or has a comma or a space at the start or end. The old version of the node reads it as one name, so the result could change. Replace this node by hand.`);
    }
}
function legacyAggregate(node) {
    const { parameters } = node;
    const aggregate = readChoice(parameters, 'aggregate', 'aggregateIndividualFields', 'Aggregate', [
        'aggregateIndividualFields',
        'aggregateAllItemData',
    ]);
    if (aggregate === 'aggregateIndividualFields') {
        const options = readOptions(node, ['disableDotNotation', 'mergeLists', 'keepMissing']);
        return {
            parameters: {
                ...(0, parameter_readers_1.pickDefined)(parameters, ['aggregate', 'fieldsToAggregate']),
                ...withOptions(options),
            },
            notes: canStopForMissingField(node, options) ? [MISSING_FIELD_NOTE] : undefined,
        };
    }
    const include = readChoice(parameters, 'include', 'allFields', 'Include', [
        'allFields',
        'specifiedFields',
        'allFieldsExcept',
    ]);
    const result = (0, parameter_readers_1.pickDefined)(parameters, ['aggregate', 'destinationFieldName', 'include']);
    if (include === 'allFieldsExcept') {
        const names = readFieldNames(parameters.fieldsToExclude, 'Fields to Exclude');
        if (names.length > 0)
            result.fieldsToExclude = names.join(', ');
    }
    if (include === 'specifiedFields') {
        const names = readFieldNames(parameters.fieldsToInclude, 'Fields to Include');
        if (names.length > 0)
            result.fieldsToInclude = names.join(', ');
    }
    return { parameters: result };
}
function legacyRemoveDuplicates(node) {
    const { parameters } = node;
    const compare = readChoice(parameters, 'compare', 'allFields', 'Compare', [
        'allFields',
        'allFieldsExcept',
        'selectedFields',
    ]);
    const result = (0, parameter_readers_1.pickDefined)(parameters, ['compare']);
    if (compare === 'allFields')
        return { parameters: result };
    const options = readOptions(node, ['disableDotNotation', 'removeOtherFields']);
    if (Object.values(options).some((value) => typeof value !== 'boolean')) {
        throw new Error('An option of this node is an expression or has an unsupported value. Replace this node by hand.');
    }
    if (compare === 'allFieldsExcept') {
        const names = readFieldNames(parameters.fieldsToExclude, 'Fields to Exclude');
        if (names.length > 0)
            result.fieldsToExclude = names.join(', ');
    }
    else {
        const names = readFieldNames(parameters.fieldsToCompare, 'Fields to Compare', { trim: true });
        if (names.length > 0)
            result.fieldsToCompare = names.join(', ');
    }
    return { parameters: { ...result, ...withOptions(options) } };
}
const INCLUDE_MODES = ['noOtherFields', 'allOtherFields', 'selectedOtherFields'];
function legacySplitOut(node) {
    const { parameters } = node;
    const isVersion1 = node.typeVersion < 2;
    const fieldToSplitOut = parameters.fieldToSplitOut ?? '';
    if (typeof fieldToSplitOut !== 'string')
        throw unreadable('Field to Split Out');
    if (isVersion1)
        assertPlainName(fieldToSplitOut, 'Field to Split Out');
    else
        (0, item_lists_checks_1.assertNoEmptyFieldToSplitOut)(node);
    if (!(0, parameter_readers_1.isExpression)(fieldToSplitOut)) {
        for (const name of fieldToSplitOut.split(',').map((entry) => entry.trim())) {
            if (name.startsWith('$json.') || name === '$binary') {
                throw new Error('"Field to Split Out" starts with "$json." or is "$binary". The new node reads these names in a special way, so the result could change. Replace this node by hand.');
            }
        }
    }
    const include = readChoice(parameters, 'include', 'noOtherFields', 'Include', INCLUDE_MODES);
    const options = readOptions(node, ['disableDotNotation', 'destinationFieldName']);
    const { disableDotNotation, destinationFieldName } = options;
    if (disableDotNotation !== undefined && typeof disableDotNotation !== 'boolean') {
        throw new Error('"Disable Dot Notation" is an expression. The old node reads it once and the new node reads it for each item, so the results could differ. Replace this node by hand.');
    }
    if (destinationFieldName !== undefined && typeof destinationFieldName !== 'string') {
        throw unreadable('Destination Field Name');
    }
    if (isVersion1 && destinationFieldName !== undefined) {
        assertPlainName(destinationFieldName, 'Destination Field Name', { allowEmpty: true });
    }
    const result = (0, parameter_readers_1.pickDefined)(parameters, ['fieldToSplitOut', 'include']);
    if (include === 'selectedOtherFields') {
        const names = readFieldNames(parameters.fieldsToInclude, 'Fields to Include');
        if (names.length > 0)
            result.fieldsToInclude = names.join(',');
        if (isVersion1 &&
            names.some((name) => name === fieldToSplitOut || name === destinationFieldName)) {
            throw new Error('"Fields to Include" has the same name as the field to split out or its destination field. The new node orders these in a different way. Replace this node by hand.');
        }
    }
    if (isVersion1 &&
        include === 'allOtherFields' &&
        disableDotNotation === true &&
        /[.[]/.test(fieldToSplitOut)) {
        throw new Error('"Field to Split Out" has a dot or a bracket while "Disable Dot Notation" is on. The new node removes this field in a different way. Replace this node by hand.');
    }
    return {
        parameters: { ...result, ...withOptions(options) },
        notes: splitOutNote(node.typeVersion),
    };
}
const SUMMARIZE_KEY_PREFIXES = {
    append: 'appended_',
    average: 'average_',
    concatenate: 'concatenated_',
    count: 'count_',
    countUnique: 'unique_count_',
    sum: 'sum_',
};
const normalizeKey = (key) => key.replace(/[\]["]/g, '').replace(/[ .]/g, '_');
function legacySummarize(node) {
    (0, item_lists_checks_1.assertNoSplitBy)(node);
    (0, item_lists_checks_1.assertIncludeEmptyIsInert)(node);
    const isVersion1 = node.typeVersion < 2;
    const entries = (0, parameter_readers_1.asParameters)(node.parameters.fieldsToSummarize)?.values;
    const normalizedToRaw = new Map();
    for (const entry of Array.isArray(entries) ? entries.map(parameter_readers_1.asParameters) : []) {
        const aggregation = entry?.aggregation ?? 'count';
        if (typeof aggregation !== 'string' || (0, parameter_readers_1.isExpression)(aggregation)) {
            throw new Error('A field to summarize has an aggregation that is an expression. Replace this node by hand.');
        }
        if (aggregation === 'min' || aggregation === 'max') {
            throw new Error('A field uses Minimum or Maximum. The old node compared only numbers, and the new node also compares text and dates, so the results could change. Replace this node by hand.');
        }
        const prefix = SUMMARIZE_KEY_PREFIXES[aggregation];
        if (prefix === undefined) {
            throw new Error('A field to summarize has an unsupported aggregation. Replace this node by hand.');
        }
        const field = entry?.field ?? '';
        if (typeof field !== 'string')
            throw unreadable('Field');
        if ((0, parameter_readers_1.isExpression)(field)) {
            if (isVersion1) {
                throw new Error('A field to summarize is an expression. Replace this node by hand.');
            }
            continue;
        }
        const raw = `${prefix}${field}`;
        const normalized = normalizeKey(raw);
        if (isVersion1 && normalized !== raw) {
            throw new Error(`The field "${field}" has a bracket, a quote, a dot or a space. The old version of the node keeps it in the output name and the new node changes it, so the output names would change. Replace this node by hand.`);
        }
        const earlier = normalizedToRaw.get(normalized);
        if (earlier !== undefined && earlier !== raw) {
            throw new Error('Two fields to summarize give the same output name after the new node cleans up the names. Replace this node by hand.');
        }
        normalizedToRaw.set(normalized, raw);
    }
    return {
        typeVersion: node.typeVersion < 2.1 ? 1 : 1.1,
        parameters: {
            ...(0, parameter_readers_1.pickDefined)(node.parameters, ['fieldsToSummarize']),
            ...withOptions(readOptions(node, ['disableDotNotation', 'outputFormat', 'skipEmptySplitFields'])),
        },
    };
}
//# sourceMappingURL=item-lists-legacy.js.map