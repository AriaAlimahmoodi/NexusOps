import { z } from 'zod';
import { parseSchema } from './parse-schema';
export const parseIfThenElse = (jsonSchema, refs) => {
    const $if = parseSchema(jsonSchema.if, { ...refs, path: [...refs.path, 'if'] });
    const $then = parseSchema(jsonSchema.then, {
        ...refs,
        path: [...refs.path, 'then'],
    });
    const $else = parseSchema(jsonSchema.else, {
        ...refs,
        path: [...refs.path, 'else'],
    });
    return z.union([$then, $else]).superRefine((value, ctx) => {
        const result = $if.safeParse(value).success ? $then.safeParse(value) : $else.safeParse(value);
        if (!result.success) {
            result.error.errors.forEach((error) => ctx.addIssue(error));
        }
    });
};
