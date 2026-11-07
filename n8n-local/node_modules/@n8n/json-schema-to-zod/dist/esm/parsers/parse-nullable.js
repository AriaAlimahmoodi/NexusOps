import { parseSchema } from './parse-schema';
import { omit } from '../utils/omit';
/**
 * For compatibility with open api 3.0 nullable
 */
export const parseNullable = (jsonSchema, refs) => {
    return parseSchema(omit(jsonSchema, 'nullable'), refs, true).nullable();
};
