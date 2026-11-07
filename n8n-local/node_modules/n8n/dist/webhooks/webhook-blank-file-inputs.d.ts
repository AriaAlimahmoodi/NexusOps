import type formidable from 'formidable';
type ParsedFiles = Record<string, formidable.File[] | undefined>;
export declare const discardBlankFileInputs: (files: ParsedFiles) => Promise<ParsedFiles>;
export {};
