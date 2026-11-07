import { z } from 'zod';
export const parseEnum = (jsonSchema) => {
    if (jsonSchema.enum.length === 0) {
        return z.never();
    }
    if (jsonSchema.enum.length === 1) {
        // union does not work when there is only one element
        return z.literal(jsonSchema.enum[0]);
    }
    if (jsonSchema.enum.every((x) => typeof x === 'string')) {
        return z.enum(jsonSchema.enum);
    }
    return z.union(jsonSchema.enum.map((x) => z.literal(x)));
};
