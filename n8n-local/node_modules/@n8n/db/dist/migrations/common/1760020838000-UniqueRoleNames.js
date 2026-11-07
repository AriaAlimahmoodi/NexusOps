"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniqueRoleNames1760020838000 = void 0;
class UniqueRoleNames1760020838000 {
    async up({ escape, runQuery }) {
        const tableName = escape.tableName('role');
        const displayNameColumn = escape.columnName('displayName');
        const slugColumn = escape.columnName('slug');
        const createdAtColumn = escape.columnName('createdAt');
        const allRoles = await runQuery(`SELECT ${slugColumn}, ${displayNameColumn} FROM ${tableName} ORDER BY ${displayNameColumn}, ${createdAtColumn} ASC`);
        const groupedByName = new Map();
        for (const role of allRoles) {
            const existing = groupedByName.get(role.displayName) || [];
            existing.push(role);
            groupedByName.set(role.displayName, existing);
        }
        for (const [_, roles] of groupedByName.entries()) {
            if (roles.length > 1) {
                const duplicates = roles.slice(1);
                let index = 2;
                for (const role of duplicates.values()) {
                    let newDisplayName = `${role.displayName} ${index}`;
                    while (allRoles.some((r) => r.displayName === newDisplayName)) {
                        index++;
                        newDisplayName = `${role.displayName} ${index}`;
                    }
                    await runQuery(`UPDATE ${tableName} SET ${displayNameColumn} = :displayName WHERE ${slugColumn} = :slug`, {
                        displayName: newDisplayName,
                        slug: role.slug,
                    });
                    index++;
                }
            }
        }
        const indexName = escape.indexName('UniqueRoleDisplayName');
        await runQuery(`CREATE UNIQUE INDEX ${indexName} ON ${tableName} (${displayNameColumn})`);
    }
    async down({ escape, runQuery }) {
        const indexName = escape.indexName('UniqueRoleDisplayName');
        await runQuery(`DROP INDEX ${indexName}`);
    }
}
exports.UniqueRoleNames1760020838000 = UniqueRoleNames1760020838000;
//# sourceMappingURL=1760020838000-UniqueRoleNames.js.map