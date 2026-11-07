export { SyslogClient } from './client';
export { createClient } from './factory';
export { Facility, Severity, Transport } from './constants';
export type { ClientOptions, DateFormatter, LogOptions, SyslogCallback } from './types';
export { ConnectionError, SyslogClientError, TimeoutError, TransportError, ValidationError, } from './errors';
