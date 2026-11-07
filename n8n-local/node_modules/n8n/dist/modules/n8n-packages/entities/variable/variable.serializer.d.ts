import type { Variables } from '@n8n/db';
import { type SerializedVariable } from '../../spec/serialized/variable.schema';
export declare class VariableSerializer {
    serialize(variable: Variables, { includeValue }?: {
        includeValue?: boolean;
    }): SerializedVariable;
}
