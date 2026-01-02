import { GASLESS_TX_TYPE } from '../../constants';
import { bridgeGaslessWitnessType, defaultWitnessType, Permit2Params, swapGaslessWitnessType, WitnessData } from '../../types/permit';

export const getPermit2WitnessData = (params: Permit2Params) => {
  const { gasless, account, spender } = params;

  let witnessData: WitnessData;
  if (gasless && params.swapDataHash) {
    if (params.txType === GASLESS_TX_TYPE.swap) {
      witnessData = {
        witness: {
          txId: params.txId,
          user: account,
          executorFeesHash: params.executorFeesHash,
          swapDataHash: params.swapDataHash,
        },
        witnessTypeName: swapGaslessWitnessType.typeName,
        witnessType: swapGaslessWitnessType.type,
      };
    } else {
      witnessData = {
        witness: {
          txId: params.txId,
          user: account,
          executorFeesHash: params.executorFeesHash,
          swapDataHash: params.swapDataHash,
          adapterDataHash: params.adapterDataHash,
        },
        witnessTypeName: bridgeGaslessWitnessType.typeName,
        witnessType: bridgeGaslessWitnessType.type,
      };
    }
  } else {
    witnessData = {
      witness: {
        owner: account,
        recipient: spender,
      },
      witnessTypeName: defaultWitnessType.typeName,
      witnessType: defaultWitnessType.type,
    };
  }

  return { witnessData };
};
