"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWE_KEY_CACHE_KEY = exports.JWE_KEY_USE = exports.JWE_KEY_ALGORITHMS = exports.JWE_EC_ALGORITHMS = exports.JWE_RSA_ALGORITHMS = exports.JWE_PRIVATE_KEY_TYPE = void 0;
var db_1 = require("@n8n/db");
Object.defineProperty(exports, "JWE_PRIVATE_KEY_TYPE", { enumerable: true, get: function () { return db_1.OAUTH_JWE_PRIVATE_KEY_TYPE; } });
exports.JWE_RSA_ALGORITHMS = ['RSA-OAEP-256'];
exports.JWE_EC_ALGORITHMS = [
    'ECDH-ES',
    'ECDH-ES+A128KW',
    'ECDH-ES+A192KW',
    'ECDH-ES+A256KW',
];
exports.JWE_KEY_ALGORITHMS = ['RSA-OAEP-256'];
exports.JWE_KEY_USE = 'enc';
exports.JWE_KEY_CACHE_KEY = 'jwe:key-pair';
//# sourceMappingURL=oauth-jwe.constants.js.map