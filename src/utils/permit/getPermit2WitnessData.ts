import { GaslessTxType } from 'src/constants';
import { bridgeGaslessWitness, defaultWitness, swapGaslessWitness } from 'src/constants/permit';
import { Permit2Params, Witness } from 'src/types/permit';

export const getPermit2WitnessData = (params: Permit2Params) => {
  const { gasless, account, spender } = params;
  const witnessData: Witness = gasless
    ? params.txType === GaslessTxType.swap
      ? {
          witness: {
            txId: params.txId,
            user: account,
            executorFeesHash: params.executorFeesHash,
            swapDataHash: params.swapDataHash,
          },
          witnessTypeName: swapGaslessWitness.witnessTypeName,
          witnessType: swapGaslessWitness.witnessType,
        }
      : {
          witness: {
            txId: params.txId,
            user: account,
            executorFeesHash: params.executorFeesHash,
            swapDataHash: params.swapDataHash,
            adapterDataHash: params.adapterDataHash,
          },
          witnessTypeName: bridgeGaslessWitness.witnessTypeName,
          witnessType: bridgeGaslessWitness.witnessType,
        }
    : {
        witness: {
          owner: account,
          recipient: spender,
        },
        witnessTypeName: defaultWitness.witnessTypeName,
        witnessType: defaultWitness.witnessType,
      };

  // const witnessHash = ethers.utils._TypedDataEncoder.from(witnessData.witnessType).hash(witnessData.witness);

  return { witnessData };
};
