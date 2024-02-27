"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockLogger = void 0;
class MockLogger {
    error(message, object) { }
    info(message, object) { }
}
const mockLog = new MockLogger();
const createMockLogger = () => {
    return new MockLogger();
};
exports.createMockLogger = createMockLogger;
