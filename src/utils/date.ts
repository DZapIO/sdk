export const generateDeadline = (expiryInSecs: number): bigint => {
  const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
  return BigInt(currentTime + expiryInSecs);
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
