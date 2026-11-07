"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Column = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
class Column {
    constructor(name) {
        this.name = name;
        this.isGenerated = false;
        this.isGenerated2 = false;
        this.isNullable = true;
        this.isPrimary = false;
    }
    get bool() {
        this.type = 'boolean';
        return this;
    }
    get int() {
        this.type = 'int';
        return this;
    }
    get bigint() {
        this.type = 'bigint';
        return this;
    }
    get smallint() {
        this.type = 'smallint';
        return this;
    }
    get double() {
        this.type = 'double';
        return this;
    }
    varchar(length) {
        this.type = 'varchar';
        this.length = length ?? 'auto';
        return this;
    }
    get text() {
        this.type = 'text';
        return this;
    }
    get json() {
        this.type = 'json';
        return this;
    }
    timestamp(msPrecision = 3) {
        this.type = 'timestamptz';
        this.length = msPrecision ?? 'auto';
        return this;
    }
    timestampTimezone(msPrecision = 3) {
        this.type = 'timestamptz';
        this.length = msPrecision ?? 'auto';
        return this;
    }
    timestampNoTimezone(msPrecision = 3) {
        this.type = 'timestamp';
        this.length = msPrecision ?? 'auto';
        return this;
    }
    get uuid() {
        this.type = 'uuid';
        return this;
    }
    get binary() {
        this.type = 'binary';
        return this;
    }
    get primary() {
        this.isPrimary = true;
        return this;
    }
    primaryWithName(name) {
        this.isPrimary = true;
        this.primaryKeyConstraintName = name;
        return this;
    }
    get notNull() {
        this.isNullable = false;
        return this;
    }
    default(value) {
        this.defaultValue = value;
        return this;
    }
    get autoGenerate() {
        this.assertCanAutogenerate('autoGenerate');
        this.isGenerated = true;
        return this;
    }
    get autoGenerate2() {
        this.assertCanAutogenerate('autoGenerate2');
        this.isGenerated2 = true;
        return this;
    }
    comment(comment) {
        this.commentValue = comment;
        return this;
    }
    withEnumCheck(values) {
        this.enumCheckValues = values;
        return this;
    }
    getEnumCheck() {
        if (this.enumCheckValues) {
            return { columnName: this.name, values: this.enumCheckValues };
        }
        return undefined;
    }
    toOptions(driver) {
        const { name, type, isNullable, isPrimary, isGenerated, isGenerated2, length, primaryKeyConstraintName, } = this;
        const isPostgres = 'postgres' in driver;
        const isSqlite = 'sqlite' in driver;
        const options = {
            primaryKeyConstraintName,
            name,
            isNullable,
            isPrimary,
            type,
        };
        if (options.type === 'int' && isSqlite) {
            options.type = 'integer';
        }
        else if (type === 'timestamptz') {
            options.type = isPostgres ? 'timestamptz' : 'datetime';
        }
        else if (type === 'timestamp') {
            options.type = isPostgres ? 'timestamp' : 'datetime';
        }
        else if (type === 'json' && isSqlite) {
            options.type = 'text';
        }
        else if (type === 'uuid') {
            if (isSqlite)
                options.type = 'varchar';
        }
        else if (type === 'double') {
            if (isPostgres) {
                options.type = 'double precision';
            }
            else if (isSqlite) {
                options.type = 'real';
            }
        }
        else if (type === 'bigint') {
            options.type = 'bigint';
        }
        else if (type === 'binary') {
            if (isPostgres) {
                options.type = 'bytea';
            }
            else if (isSqlite) {
                options.type = 'blob';
            }
        }
        if ((type === 'varchar' || type === 'timestamptz' || type === 'timestamp') &&
            length !== 'auto') {
            options.type = `${options.type}(${length})`;
        }
        if (isGenerated) {
            this.assertCanAutogenerate('autoGenerate');
            options.isGenerated = true;
            options.generationStrategy = 'increment';
        }
        if (isGenerated2) {
            this.assertCanAutogenerate('autoGenerate2');
            options.isGenerated = true;
            options.generationStrategy = 'identity';
        }
        if (isPrimary || isGenerated || isGenerated2) {
            options.isNullable = false;
        }
        if (this.defaultValue !== undefined) {
            if ((type === 'timestamptz' || type === 'timestamp') && this.defaultValue === 'NOW()') {
                options.default = isSqlite
                    ? "STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')"
                    : 'CURRENT_TIMESTAMP(3)';
            }
            else {
                options.default = this.defaultValue;
            }
        }
        if (this.commentValue) {
            options.comment = this.commentValue;
        }
        return options;
    }
    assertCanAutogenerate(method) {
        (0, node_assert_1.default)(this.type !== 'uuid', `${method} on UUID columns emits DEFAULT uuid_generate_v4(), which fails on managed Postgres (e.g. Supabase). Use column.uuid.primary.notNull and generate UUIDs in application code instead.`);
    }
}
exports.Column = Column;
//# sourceMappingURL=column.js.map