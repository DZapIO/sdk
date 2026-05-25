import axios from 'axios';
import TonWeb from 'tonweb';
import { ChainData } from '../../types';
import { AddressClassifyResult, AddressKind } from '../../types/address';
import { formatToken, isNativeCurrency } from '../tokens';

const TON_DEFAULT_RPC = 'https://toncenter.com/api/v2';

async function fetchTonAddressInformation(baseUrl: string, address: string) {
  const response = await axios.get(`${baseUrl}/getAddressInformation`, { params: { address } });
  if (response.status !== 200 || response.data?.error || response.data?.ok === false) {
    throw new Error(response.data?.error ?? `getAddressInformation failed with status ${response.status}`);
  }
  return response.data?.result;
}

async function fetchTonJettonData(baseUrl: string, address: string) {
  const response = await axios.post(
    `${baseUrl}/runGetMethod`,
    { address, method: 'get_jetton_data', stack: [] },
    { validateStatus: (status) => status < 500 },
  );
  if (response.status !== 200 || response.data?.error || response.data?.ok === false) {
    throw new Error(response.data?.error ?? `runGetMethod failed with status ${response.status}`);
  }
  return response.data?.result;
}

export async function classifyTonvmAddress(params: {
  address: string;
  chainId: number;
  chainConfig: ChainData;
  rpcUrls?: string[];
}): Promise<AddressClassifyResult | null> {
  const { chainConfig, rpcUrls } = params;
  const address = formatToken(params.address);

  if (!TonWeb.utils.Address.isValid(address)) {
    return {
      valid: false,
      kind: AddressKind.INVALID,
      isNative: false,
      isToken: false,
      isContract: false,
      address,
    };
  }

  if (isNativeCurrency(address, chainConfig)) {
    return {
      valid: true,
      kind: AddressKind.NATIVE,
      isNative: true,
      isToken: true,
      isContract: false,
      address,
    };
  }

  const baseUrl = (rpcUrls?.[0] ?? TON_DEFAULT_RPC).replace(/\/$/, '');

  try {
    const [infoResult, jettonResult] = await Promise.allSettled([fetchTonAddressInformation(baseUrl, address), fetchTonJettonData(baseUrl, address)]);

    if (infoResult.status === 'fulfilled' && !infoResult.value?.code) {
      return {
        valid: true,
        kind: AddressKind.WALLET,
        isNative: false,
        isToken: false,
        isContract: false,
        address,
      };
    }

    if (jettonResult.status === 'fulfilled' && jettonResult.value?.exit_code === 0) {
      return {
        valid: true,
        kind: AddressKind.TOKEN,
        isNative: false,
        isToken: true,
        isContract: true,
        address,
      };
    }

    if (infoResult.status === 'fulfilled' && infoResult.value?.code) {
      return {
        valid: true,
        kind: AddressKind.CONTRACT,
        isNative: false,
        isToken: false,
        isContract: true,
        address,
      };
    }

    return null;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`RPC error (TON classify): ${message}`);
    return null;
  }
}
