import { Versions } from 'src/enums';
import { AvailableDZapServices } from '.';

export type ContractConfig = {
  [serviceKey in AvailableDZapServices]: {
    [versionKey in Versions]?: {
      address: ContractAddress;
      abi: string;
    };
  };
};

export type ContractAddress = {
  otherChains: string;
  zkSync: string;
};
