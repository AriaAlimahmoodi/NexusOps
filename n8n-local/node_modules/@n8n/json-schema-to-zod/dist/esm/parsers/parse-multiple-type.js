import { z } from 'zod';
import { parseSchema } from './parse-schema';
export const parseMultipleType = (jsonSchema, refs) => {
    return z.union(jsonSchema.type.map((type) => parseSchema({ ...jsonSchema, type }, refs)));
};
