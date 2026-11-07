import { type Jwk } from '@n8n/inbound-auth';
export declare const getPublicKeyFromJwk: (jwks: Array<Jwk>, kid: string, usage?: string) => import("crypto").KeyObject | undefined;
