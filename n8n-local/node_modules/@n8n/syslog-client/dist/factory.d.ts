import { SyslogClient } from './client';
import type { ClientOptions } from './types';
export declare function createClient(target?: string, options?: ClientOptions): SyslogClient;
