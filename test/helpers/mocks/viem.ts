export const createMockPublicClient = (readContractResult: unknown = 0n) => ({
  readContract: jest.fn().mockResolvedValue(readContractResult),
  getBlockNumber: jest.fn().mockResolvedValue(100n),
  simulateContract: jest.fn().mockResolvedValue({ request: {} }),
});

export const mockGetPublicClient = (client = createMockPublicClient()) => {
  return jest.fn().mockReturnValue(client);
};
