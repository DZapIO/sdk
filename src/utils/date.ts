export const generateDeadline = (expiryInSecs: number): bigint => {
  const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
  return BigInt(currentTime + expiryInSecs);
};
