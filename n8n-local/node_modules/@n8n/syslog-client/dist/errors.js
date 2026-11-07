"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeoutError = exports.TransportError = exports.ConnectionError = exports.ValidationError = exports.SyslogClientError = void 0;
class SyslogClientError extends Error {
    constructor(message, code, cause) {
        super(message);
        this.code = code;
        this.cause = cause;
        this.name = 'SyslogClientError';
        Object.setPrototypeOf(this, SyslogClientError.prototype);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
exports.SyslogClientError = SyslogClientError;
class ValidationError extends SyslogClientError {
    constructor(message, validationErrors) {
        super(message, 'VALIDATION_ERROR');
        this.validationErrors = validationErrors;
        this.name = 'ValidationError';
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
    static fromZod(message, zodErrors) {
        const errors = zodErrors.map((zodError) => ({
            path: zodError.path.join('.'),
            message: zodError.message,
        }));
        return new ValidationError(message, errors);
    }
}
exports.ValidationError = ValidationError;
class ConnectionError extends SyslogClientError {
    constructor(message, cause) {
        super(message, 'CONNECTION_ERROR', cause);
        this.name = 'ConnectionError';
        Object.setPrototypeOf(this, ConnectionError.prototype);
    }
}
exports.ConnectionError = ConnectionError;
class TransportError extends SyslogClientError {
    constructor(message, transportType, cause) {
        super(message, 'TRANSPORT_ERROR', cause);
        this.transportType = transportType;
        this.name = 'TransportError';
        Object.setPrototypeOf(this, TransportError.prototype);
    }
}
exports.TransportError = TransportError;
class TimeoutError extends SyslogClientError {
    constructor(message = 'Connection timed out') {
        super(message, 'TIMEOUT_ERROR');
        this.name = 'TimeoutError';
        Object.setPrototypeOf(this, TimeoutError.prototype);
    }
}
exports.TimeoutError = TimeoutError;
//# sourceMappingURL=errors.js.map