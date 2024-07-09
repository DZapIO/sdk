import { appEnv } from 'src/config';
import { Services } from 'src/constants';
import { contractAddress } from 'src/constants/contract';
import { Versions } from 'src/enums';
import { HexString } from 'src/types';

export const CURRENT_VERSION = {
  [Services.BatchSwap]: Versions.V2,
  [Services.CrossChain]: Versions.V2,
  [Services.Dca]: Versions.V1,
};

export const getDZapContractAddress = (chainId: number, service: keyof typeof Services) => {
  const address = contractAddress[appEnv][service][CURRENT_VERSION[service]]?.address[chainId] as HexString;

  if (!address) {
    throw Error(`Contract Address for ${service} ${CURRENT_VERSION[service]} ${chainId} is undefined`);
  }

  return address;
};
