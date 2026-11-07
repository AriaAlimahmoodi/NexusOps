import { OpenAIError } from 'openai/error';
export declare function getCustomErrorMessage(errorCode: string): string | undefined;
export declare function isOpenAiError(error: any): error is OpenAIError;
export declare const openAiFailedAttemptHandler: (error: unknown) => void;
