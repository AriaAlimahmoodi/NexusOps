import { z } from 'zod';
import { parseSchema } from './parse-schema';
export const parseNot = (jsonSchema, refs) => {
    return z.any().refine((value) => !parseSchema(jsonSchema.not, {
        ...refs,
        path: [...refs.path, 'not'],
    }).safeParse(value).success, 'Invalid input: Should NOT be valid against schema');
};
