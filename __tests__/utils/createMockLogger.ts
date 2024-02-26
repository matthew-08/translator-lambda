import { ILogger } from '../../src/log/log';

class MockLogger implements ILogger {
  private _internalLogger: any;
  error(message: string, object?: any): void {}
  info(message: string, object?: any): void {}
}
const mockLog = new MockLogger();

export const createMockLogger = () => {
  return new MockLogger();
};
