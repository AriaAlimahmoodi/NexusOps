import { type UpdateLogStreamingDestinationPublic } from '@n8n/api-types';
import type { MessageEventBusDestinationOptions } from 'n8n-workflow';
export declare function toLogStreamingDestinationPublic(options: MessageEventBusDestinationOptions): {
    label?: string | undefined;
    enabled?: boolean | undefined;
    subscribedEvents?: string[] | undefined;
    anonymizeAuditMessages?: boolean | undefined;
    circuitBreaker?: {
        maxFailures?: number | undefined;
        failureWindow?: number | undefined;
    } | undefined;
    type: "webhook";
    method?: string | undefined;
    sendHeaders?: boolean | undefined;
    specifyHeaders?: string | undefined;
    headerParameters?: {
        parameters: {
            name: string;
            value: string | number | boolean | null;
        }[];
    } | undefined;
    jsonHeaders?: string | undefined;
    sendQuery?: boolean | undefined;
    specifyQuery?: string | undefined;
    queryParameters?: {
        parameters: {
            name: string;
            value: string | number | boolean | null;
        }[];
    } | undefined;
    jsonQuery?: string | undefined;
    options?: {
        timeout?: number | undefined;
        allowUnauthorizedCerts?: boolean | undefined;
        queryParameterArrays?: "brackets" | "indices" | "repeat" | undefined;
        redirect?: {
            redirect: {
                followRedirects?: boolean | undefined;
                maxRedirects?: number | undefined;
            };
        } | undefined;
        proxy?: {
            proxy: {
                protocol: "http" | "https";
                host: string;
                port: number;
            };
        } | undefined;
        socket?: {
            keepAlive?: boolean | undefined;
            maxSockets?: number | undefined;
            maxFreeSockets?: number | undefined;
        } | undefined;
    } | undefined;
    id: string;
    url: string;
} | {
    label?: string | undefined;
    enabled?: boolean | undefined;
    subscribedEvents?: string[] | undefined;
    anonymizeAuditMessages?: boolean | undefined;
    circuitBreaker?: {
        maxFailures?: number | undefined;
        failureWindow?: number | undefined;
    } | undefined;
    type: "syslog";
    port?: number | undefined;
    protocol?: "tcp" | "tls" | "udp" | undefined;
    facility?: number | undefined;
    app_name?: string | undefined;
    tlsCa?: string | undefined;
    id: string;
    host: string;
} | {
    label?: string | undefined;
    enabled?: boolean | undefined;
    subscribedEvents?: string[] | undefined;
    anonymizeAuditMessages?: boolean | undefined;
    circuitBreaker?: {
        maxFailures?: number | undefined;
        failureWindow?: number | undefined;
    } | undefined;
    type: "sentry";
    id: string;
    dsn: string;
};
export declare function toInternalDestinationOptions(input: UpdateLogStreamingDestinationPublic): MessageEventBusDestinationOptions;
