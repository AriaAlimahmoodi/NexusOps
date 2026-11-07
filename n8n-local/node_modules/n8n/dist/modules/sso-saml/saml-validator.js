"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SamlValidator = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const invalid_saml_metadata_error_1 = require("./errors/invalid-saml-metadata.error");
let SamlValidator = class SamlValidator {
    constructor(logger) {
        this.logger = logger;
        this.preload = [];
    }
    async init() {
        if (this.samlify)
            return;
        this.samlify = await import('samlify');
        await this.loadSchemas();
        this.xmllint = await import('xmllint-wasm');
    }
    validateIdentityProvider(idp) {
        const binding = idp.entityMeta.getSingleSignOnService(this.samlify.Constants.wording.binding.redirect);
        if (typeof binding !== 'string') {
            throw new invalid_saml_metadata_error_1.InvalidSamlMetadataError('only SAML redirect binding is supported.');
        }
    }
    async validateMetadata(metadata) {
        const validXML = await this.validateXml('metadata', metadata);
        if (validXML) {
            const idp = this.samlify.IdentityProvider({
                metadata,
            });
            this.validateIdentityProvider(idp);
        }
        return validXML;
    }
    async validateResponse(response) {
        return await this.validateXml('response', response);
    }
    async loadSchemas() {
        this.xmlProtocol = (await import('./schema/saml-schema-protocol-2.0.xsd.js')).xmlFileInfo;
        this.xmlMetadata = (await import('./schema/saml-schema-metadata-2.0.xsd.js')).xmlFileInfo;
        this.preload = (await Promise.all([
            import('./schema/saml-schema-assertion-2.0.xsd.js'),
            import('./schema/xmldsig-core-schema.xsd.js'),
            import('./schema/xenc-schema.xsd.js'),
            import('./schema/xml.xsd.js'),
            import('./schema/ws-federation.xsd.js'),
            import('./schema/oasis-200401-wss-wssecurity-secext-1.0.xsd.js'),
            import('./schema/oasis-200401-wss-wssecurity-utility-1.0.xsd.js'),
            import('./schema/ws-addr.xsd.js'),
            import('./schema/metadata-exchange.xsd.js'),
            import('./schema/ws-securitypolicy-1.2.xsd.js'),
            import('./schema/ws-authorization.xsd.js'),
        ])).map((m) => m.xmlFileInfo);
    }
    async validateXml(type, contents) {
        const fileName = `${type}.xml`;
        const schema = type === 'metadata' ? [this.xmlMetadata] : [this.xmlProtocol];
        const preload = [type === 'metadata' ? this.xmlProtocol : this.xmlMetadata, ...this.preload];
        try {
            const validationResult = await this.xmllint.validateXML({
                xml: [{ fileName, contents }],
                extension: 'schema',
                schema,
                preload,
            });
            if (validationResult?.valid) {
                this.logger.debug(`SAML ${type} is valid`);
                return true;
            }
            else {
                this.logger.debug(`SAML ${type} is invalid`);
                this.logger.warn(validationResult
                    ? validationResult.errors
                        .map((error) => `${error.message} - ${error.rawMessage}`)
                        .join('\n')
                    : '');
            }
        }
        catch (error) {
            this.logger.warn(error);
        }
        return false;
    }
};
exports.SamlValidator = SamlValidator;
exports.SamlValidator = SamlValidator = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger])
], SamlValidator);
//# sourceMappingURL=saml-validator.js.map