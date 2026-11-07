import { OperationalError, UserError } from 'n8n-workflow';
export declare class LdapRejectionError extends UserError {
}
export declare class LdapConnectionError extends OperationalError {
}
