export { OAUTH_JWE_PRIVATE_KEY_TYPE as JWE_PRIVATE_KEY_TYPE } from '@n8n/db';
export declare const JWE_RSA_ALGORITHMS: readonly ['RSA-OAEP-256'];
export type JweRsaAlgorithm = (typeof JWE_RSA_ALGORITHMS)[number];
export declare const JWE_EC_ALGORITHMS: readonly ['ECDH-ES', 'ECDH-ES+A128KW', 'ECDH-ES+A192KW', 'ECDH-ES+A256KW'];
export type JweEcAlgorithm = (typeof JWE_EC_ALGORITHMS)[number];
export declare const JWE_KEY_ALGORITHMS: readonly ['RSA-OAEP-256'];
export type JweKeyAlgorithm = (typeof JWE_KEY_ALGORITHMS)[number];
export declare const JWE_KEY_USE = "enc";
export declare const JWE_KEY_CACHE_KEY = "jwe:key-pair";
