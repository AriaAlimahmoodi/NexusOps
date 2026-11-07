"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRequest = apiRequest;
async function apiRequest(method, endpoint, parameters) {
    const { body, qs, option, headers } = parameters ?? {};
    const credentials = await this.getCredentials('googlePalmApi');
    let url = `https://generativelanguage.googleapis.com${endpoint}`;
    if (credentials.host) {
        url = `${credentials.host}${endpoint}`;
    }
    const options = {
        headers,
        method,
        body,
        qs,
        url,
        json: true,
    };
    if (option && Object.keys(option).length !== 0) {
        Object.assign(options, option);
    }
    return await this.helpers.httpRequestWithAuthentication.call(this, 'googlePalmApi', options);
}
//# sourceMappingURL=index.js.map