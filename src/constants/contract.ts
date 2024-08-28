import { AppEnv, Versions } from 'src/enums';
import { Services } from '.';
import { ContractConfig } from 'src/types/contract';

export const zkSyncChainId = 324;

export const contractAddress: { [key: string]: ContractConfig } = {
  [AppEnv.staging]: {
    [Services.dca]: {
      [Versions.V1]: {
        address: {
          zkSync: '0x3d2A3e5F13B7204cA39530D27e87184030e1F2Df',
          otherChains: '0x603B31bBE692aDCD522E280019F72b7919d6167c',
        },
        abi: 'staging/dca/v1/DZapDCA.json',
      },
    },
    [Services.swap]: {
      [Versions.V2]: {
        address: {
          zkSync: '0x66C96103d046826BEac8d01d8A8DF70ef7f18216',
          otherChains: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
        },
        abi: 'staging/core/V2/DZapCore.json',
      },
    },
    [Services.bridge]: {
      [Versions.V2]: {
        address: {
          zkSync: '0x66C96103d046826BEac8d01d8A8DF70ef7f18216',
          otherChains: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
        },
        abi: 'staging/core/V2/DZapCore.json',
      },
    },
  },
  [AppEnv.production]: {
    [Services.dca]: {
      [Versions.V1]: {
        address: {
          zkSync: '0x3d2A3e5F13B7204cA39530D27e87184030e1F2Df',
          otherChains: '0x603B31bBE692aDCD522E280019F72b7919d6167c',
        },
        abi: 'staging/dca/v1/DZapDCA.json',
      },
    },
    [Services.swap]: {
      [Versions.V2]: {
        address: {
          zkSync: '0x66C96103d046826BEac8d01d8A8DF70ef7f18216',
          otherChains: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
        },
        abi: 'staging/core/V2/DZapCore.json',
      },
    },
    [Services.bridge]: {
      [Versions.V2]: {
        address: {
          zkSync: '0x66C96103d046826BEac8d01d8A8DF70ef7f18216',
          otherChains: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
        },
        abi: 'staging/core/V2/DZapCore.json',
      },
    },
  },
  [AppEnv.development]: {
    [Services.dca]: {
      [Versions.V1]: {
        address: {
          zkSync: '0x3d2A3e5F13B7204cA39530D27e87184030e1F2Df',
          otherChains: '0x603B31bBE692aDCD522E280019F72b7919d6167c',
        },
        abi: 'dZap/dca/v1/DZapDCA.json',
      },
    },
    [Services.swap]: {
      [Versions.V2]: {
        address: {
          zkSync: '0x66C96103d046826BEac8d01d8A8DF70ef7f18216',
          otherChains: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
        },
        abi: 'dZap/core/V2/DZapCore.json',
      },
    },
    [Services.bridge]: {
      [Versions.V2]: {
        address: {
          zkSync: '0x66C96103d046826BEac8d01d8A8DF70ef7f18216',
          otherChains: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
        },
        abi: 'dZap/core/V2/DZapCore.json',
      },
    },
  },
} as const;
