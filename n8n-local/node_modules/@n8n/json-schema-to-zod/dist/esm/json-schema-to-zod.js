import { parseSchema } from './parsers/parse-schema';
export const jsonSchemaToZod = (schema, options = {}) => {
    return parseSchema(schema, {
        path: [],
        seen: new Map(),
        ...options,
    });
};
