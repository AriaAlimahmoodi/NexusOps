"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RETIRED_SIGNING_KEY_GRACE_MS = exports.OAUTH_ACCESS_TOKEN_TTL_SECONDS = exports.ACCESS_TOKEN_TYPES = exports.UNKNOWN_KID_REFRESH_MS = exports.SIGNING_KEYS_REFRESH_MS = exports.OAUTH_SIGNING_CURVE = exports.OAUTH_SIGNING_KEY_USE = exports.OAUTH_SIGNING_ALGORITHM = exports.OAUTH_SIGNING_KEY_TYPE = void 0;
const constants_1 = require("@n8n/constants");
var db_1 = require("@n8n/db");
Object.defineProperty(exports, "OAUTH_SIGNING_KEY_TYPE", { enumerable: true, get: function () { return db_1.OAUTH_SIGNING_KEY_TYPE; } });
exports.OAUTH_SIGNING_ALGORITHM = 'ES256';
exports.OAUTH_SIGNING_KEY_USE = 'sig';
exports.OAUTH_SIGNING_CURVE = 'P-256';
exports.SIGNING_KEYS_REFRESH_MS = 5 * constants_1.Time.minutes.toMilliseconds;
exports.UNKNOWN_KID_REFRESH_MS = 30 * constants_1.Time.seconds.toMilliseconds;
exports.ACCESS_TOKEN_TYPES = ['at+jwt', 'application/at+jwt'];
exports.OAUTH_ACCESS_TOKEN_TTL_SECONDS = 1 * constants_1.Time.hours.toSeconds;
exports.RETIRED_SIGNING_KEY_GRACE_MS = exports.OAUTH_ACCESS_TOKEN_TTL_SECONDS * constants_1.Time.seconds.toMilliseconds + 5 * constants_1.Time.minutes.toMilliseconds;
//# sourceMappingURL=oauth-signing-key.constants.js.map