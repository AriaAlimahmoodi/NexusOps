import type { Constructable } from '@n8n/di';
export type AuthType = 'password';
export interface AuthHandlerMetadata {
    name: string;
    type: AuthType;
}
interface IAuthHandlerBase<TUser> {
    readonly metadata: AuthHandlerMetadata;
    readonly userClass: Constructable<TUser>;
    init?(): Promise<void>;
}
export interface IPasswordAuthHandler<TUser> extends IAuthHandlerBase<TUser> {
    readonly metadata: AuthHandlerMetadata & {
        type: 'password';
    };
    handleLogin(loginId: string, password: string): Promise<TUser | undefined>;
}
export type IAuthHandler<TUser = unknown> = IPasswordAuthHandler<TUser>;
export type AuthHandlerClass = Constructable<IAuthHandler>;
export {};
