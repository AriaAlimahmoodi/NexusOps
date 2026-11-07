"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPostgresDataSource = getPostgresDataSource;
const typeorm_1 = require("@n8n/typeorm");
async function getPostgresDataSource() {
    const credentials = await this.getCredentials('postgres');
    let ssl = !['disable', undefined].includes(credentials.ssl);
    if (credentials.allowUnauthorizedCerts && ssl) {
        ssl = { rejectUnauthorized: false };
    }
    return new typeorm_1.DataSource({
        type: 'postgres',
        host: credentials.host,
        port: credentials.port,
        username: credentials.user,
        password: credentials.password,
        database: credentials.database,
        ssl,
    });
}
//# sourceMappingURL=postgres.js.map