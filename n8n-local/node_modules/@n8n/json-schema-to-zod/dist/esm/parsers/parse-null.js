import { z } from 'zod';
export const parseNull = (_jsonSchema) => {
    return z.null();
};
