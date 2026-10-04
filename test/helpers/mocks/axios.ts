export const mockInvokeResponse = <T>(data: T) => {
  jest.mock('../../../src/utils/axios', () => ({
    invoke: jest.fn().mockResolvedValue(data),
    invokeZap: jest.fn().mockResolvedValue(data),
  }));
};
