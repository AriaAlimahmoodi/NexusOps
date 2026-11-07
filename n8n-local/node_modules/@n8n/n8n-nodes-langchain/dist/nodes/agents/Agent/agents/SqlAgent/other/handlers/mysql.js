"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMysqlDataSource = getMysqlDataSource;
const typeorm_1 = require("@n8n/typeorm");
async function getMysqlDataSource() {
    const credentials = await this.getCredentials('mySql');
    const dataSource = new typeorm_1.DataSource({
        type: 'mysql',
        host: credentials.host,
        port: credentials.port,
        username: credentials.user,
        password: credentials.password,
        database: credentials.database,
        ssl: {
            rejectUnauthorized: credentials.ssl,
        },
    });
    return dataSource;
}
//# sourceMappingURL=mysql.js.map