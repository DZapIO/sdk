import { Signer } from 'ethers';

export const isEthersSigner = (variable: unknown): variable is Signer => {
  return variable instanceof Signer;
};
