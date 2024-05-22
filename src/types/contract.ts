import { Services, Versions } from 'src/enums';

export type ContractConfig = {
  [serviceKey in Services]: {
    [versionKey in Versions]?: {
      address: ContractAddress;
      abi: string;
    };
  };
};

export type ContractAddress = {
  [key: number]: string;
};
