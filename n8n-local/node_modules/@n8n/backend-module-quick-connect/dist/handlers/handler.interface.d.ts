import type { User } from '@n8n/db';
import type { QuickConnectOption } from '../quick-connect.config';
export interface IQuickConnectHandler<ConfigOption = QuickConnectOption> {
    setConfig(config: ConfigOption): void;
    getCredentialData(user: User): Promise<{
        apiKey: string;
    }>;
}
export type IQuickConnectHandlerOption<Handler> = Handler extends IQuickConnectHandler<infer Option> ? Option : never;
