import { Services, Versions } from 'src/enums';
import { CHAINS_IDS } from './chain';

export type ContractConfig = {
  [serviceKey in Services]: {
    [versionKey in Versions]?: {
      address: ContractAddress;
      abi: string;
    };
  };
};

export type ContractAddress = {
  [chainIdKey in ChainIds]?: string;
};

export type ChainNames = keyof typeof CHAINS_IDS;
export type ChainIds = (typeof CHAINS_IDS)[keyof typeof CHAINS_IDS];
