import { z } from 'zod';
export const parseConst = (jsonSchema) => {
    return z.literal(jsonSchema.const);
};
