"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialResolver = exports.CredentialResolverEntryMetadata = void 0;
var credential_resolver_metadata_1 = require("./credential-resolver-metadata");
Object.defineProperty(exports, "CredentialResolverEntryMetadata", { enumerable: true, get: function () { return credential_resolver_metadata_1.CredentialResolverEntryMetadata; } });
Object.defineProperty(exports, "CredentialResolver", { enumerable: true, get: function () { return credential_resolver_metadata_1.CredentialResolver; } });
__exportStar(require("./errors"), exports);
//# sourceMappingURL=index.js.map