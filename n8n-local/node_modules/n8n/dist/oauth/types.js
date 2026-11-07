"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.algorithmMap = exports.OauthVersion = exports.MAX_CSRF_AGE = void 0;
const constants_1 = require("@n8n/constants");
exports.MAX_CSRF_AGE = 5 * constants_1.Time.minutes.toMilliseconds;
var OauthVersion;
(function (OauthVersion) {
    OauthVersion[OauthVersion["V1"] = 1] = "V1";
    OauthVersion[OauthVersion["V2"] = 2] = "V2";
})(OauthVersion || (exports.OauthVersion = OauthVersion = {}));
exports.algorithmMap = {
    'HMAC-SHA256': 'sha256',
    'HMAC-SHA512': 'sha512',
    'HMAC-SHA1': 'sha1',
};
//# sourceMappingURL=types.js.map