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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOTPService = void 0;
const di_1 = require("@n8n/di");
const OTPAuth = __importStar(require("otpauth"));
let TOTPService = class TOTPService {
    generateSecret() {
        return new OTPAuth.Secret()?.base32;
    }
    generateTOTPUri({ issuer = 'n8n', secret, label, }) {
        return new OTPAuth.TOTP({
            secret: OTPAuth.Secret.fromBase32(secret),
            issuer,
            label,
        }).toString();
    }
    verifySecret({ secret, mfaCode, window = 2, }) {
        return new OTPAuth.TOTP({
            secret: OTPAuth.Secret.fromBase32(secret),
        }).validate({ token: mfaCode, window }) === null
            ? false
            : true;
    }
    generateTOTP(secret) {
        return OTPAuth.TOTP.generate({
            secret: OTPAuth.Secret.fromBase32(secret),
        });
    }
};
exports.TOTPService = TOTPService;
exports.TOTPService = TOTPService = __decorate([
    (0, di_1.Service)()
], TOTPService);
//# sourceMappingURL=totp.service.js.map