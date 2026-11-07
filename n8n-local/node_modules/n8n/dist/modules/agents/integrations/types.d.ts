export type TextYieldFn = (text: string) => void;
export type TextEndFn = () => void;
export declare const INTERNAL_THREAD_ID_SYMBOL: unique symbol;
export interface InternalThread {
    [INTERNAL_THREAD_ID_SYMBOL]: boolean;
    id: string;
}
export declare const toInternalThreadId: (id: string) => InternalThread;
