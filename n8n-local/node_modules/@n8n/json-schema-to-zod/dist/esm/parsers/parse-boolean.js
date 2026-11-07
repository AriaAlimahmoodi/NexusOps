import { z } from 'zod';
export const parseBoolean = (_jsonSchema) => {
    return z.boolean();
};
