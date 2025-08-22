import { GaslessTxType } from 'src/constants';
import { bridgeGaslessWitnessType, defaultWitnessType, swapGaslessWitnessType } from 'src/constants/permit';
import { Permit2Params, WitnessData } from 'src/types/permit';

export const getPermit2WitnessData = (params: Permit2Params) => {
  const { gasless, account, spender } = params;

  const witnessData: WitnessData = gasless
    ? params.txType === GaslessTxType.swap
      ? {
          witness: {
            txId: params.txId,
            user: account,
            executorFeesHash: params.executorFeesHash,
            swapDataHash: params.swapDataHash,
          },
          witnessTypeName: swapGaslessWitnessType.typeName,
          witnessType: swapGaslessWitnessType.type,
        }
      : {
          witness: {
            txId: params.txId,
            user: account,
            executorFeesHash: params.executorFeesHash,
            swapDataHash: params.swapDataHash,
            adapterDataHash: params.adapterDataHash,
          },
          witnessTypeName: bridgeGaslessWitnessType.typeName,
          witnessType: bridgeGaslessWitnessType.type,
        }
    : {
        witness: {
          owner: account,
          recipient: spender,
        },
        witnessTypeName: defaultWitnessType.typeName,
        witnessType: defaultWitnessType.type,
      };

  return { witnessData };
};
