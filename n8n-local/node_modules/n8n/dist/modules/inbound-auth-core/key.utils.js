"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicKeyFromJwk = void 0;
const node_crypto_1 = require("node:crypto");
const getPublicKeyFromJwk = (jwks, kid, usage = 'sig') => {
    const foundKey = jwks
        .filter((key) => key.use === usage || !key.use)
        .find((key) => key.kid === kid);
    if (!foundKey) {
        return undefined;
    }
    return (0, node_crypto_1.createPublicKey)({
        key: foundKey,
        format: 'jwk',
    });
};
exports.getPublicKeyFromJwk = getPublicKeyFromJwk;
//# sourceMappingURL=key.utils.js.map