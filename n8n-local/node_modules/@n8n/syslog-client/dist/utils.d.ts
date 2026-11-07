import type { DateFormatter, ResolvedLogOptions } from './types';
export declare const defaultDateFormatter: DateFormatter;
export declare const formatRfc3164Timestamp: (date: Date) => string;
export declare const buildFormattedMessage: (message: string, options: ResolvedLogOptions, dateFormatter: DateFormatter) => Buffer;
export declare const isIPv6: (address: string) => boolean;
