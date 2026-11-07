import { AuthHandlerClass } from './auth-handler';
type AuthHandlerEntry = {
    class: AuthHandlerClass;
};
export declare class AuthHandlerEntryMetadata {
    private readonly authHandlerEntries;
    register(authHandlerEntry: AuthHandlerEntry): void;
    getEntries(): [AuthHandlerEntry, AuthHandlerEntry][];
    getClasses(): AuthHandlerClass[];
}
export declare const AuthHandler: <T extends AuthHandlerClass>() => (target: T) => any;
export {};
