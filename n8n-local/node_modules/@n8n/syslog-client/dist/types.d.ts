import type * as dgram from 'dgram';
import type * as net from 'net';
import type * as tls from 'tls';
import type { Facility, Severity, Transport } from './constants';
export type SyslogCallback = (error?: Error) => void;
export type DateFormatter = (date: Date) => string;
export interface ClientOptions {
    syslogHostname?: string;
    port?: number;
    tcpTimeout?: number;
    facility?: Facility;
    severity?: Severity;
    rfc3164?: boolean;
    appName?: string;
    dateFormatter?: DateFormatter;
    udpBindAddress?: string;
    transport?: Transport;
    tlsCA?: string | string[] | Buffer | Buffer[];
}
export interface LogOptions {
    facility?: Facility;
    severity?: Severity;
    rfc3164?: boolean;
    appName?: string;
    syslogHostname?: string;
    timestamp?: Date;
    msgid?: string;
}
export interface ResolvedLogOptions {
    facility: Facility;
    severity: Severity;
    rfc3164: boolean;
    appName: string;
    syslogHostname: string;
    timestamp?: Date;
    msgid?: string;
}
export type TransportConnection = dgram.Socket | net.Socket | tls.TLSSocket;
