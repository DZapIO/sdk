export type PermitValidationResult = {
  isValid: boolean;
  details?: {
    nonce: bigint;
    currentNonce: bigint;
    expiration: bigint;
    sigDeadline: bigint;
  };
};
