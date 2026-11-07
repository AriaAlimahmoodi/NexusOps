"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.its = void 0;
exports.its = {
    an: {
        object: (x) => x.type === 'object',
        array: (x) => x.type === 'array',
        anyOf: (x) => x.anyOf !== undefined,
        allOf: (x) => x.allOf !== undefined,
        enum: (x) => x.enum !== undefined,
    },
    a: {
        nullable: (x) => 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        x.nullable === true,
        multipleType: (x) => Array.isArray(x.type),
        not: (x) => x.not !== undefined,
        const: (x) => x.const !== undefined,
        primitive: (x, p) => x.type === p,
        conditional: (x) => Boolean('if' in x && x.if && 'then' in x && 'else' in x && x.then && x.else),
        oneOf: (x) => x.oneOf !== undefined,
    },
};
