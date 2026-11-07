declare module 'zod' {
    interface ZodType {
        alias<T extends ZodType>(this: T, aliasName: string): T;
    }
    interface ZodTypeDef {
        _alias: string;
    }
}
export {};
