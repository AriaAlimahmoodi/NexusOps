import { z } from 'zod';
import { parseSchema } from './parse-schema';
export const parseAnyOf = (jsonSchema, refs) => {
    return jsonSchema.anyOf.length
        ? jsonSchema.anyOf.length === 1
            ? parseSchema(jsonSchema.anyOf[0], {
                ...refs,
                path: [...refs.path, 'anyOf', 0],
            })
            : z.union(jsonSchema.anyOf.map((schema, i) => parseSchema(schema, { ...refs, path: [...refs.path, 'anyOf', i] })))
        : z.any();
};
