import axios from 'axios';
import TonWeb from 'tonweb';
import { ChainData } from '../../types';
import { AddressClassifyResult, AddressKind } from '../../types/address';
import { isNativeCurrency } from '../tokens';

const TON_DEFAULT_RPC = 'https://toncenter.com/api/v2';

export async function classifyTonvmAddress(params: {
  address: string;
  chainId: number;
  chainConfig: ChainData;
  rpcUrls?: string[];
}): Promise<AddressClassifyResult | null> {
  const { address, chainConfig, rpcUrls } = params;

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
    const infoResponse = await axios.get(`${baseUrl}/getAddressInformation`, {
      params: { address },
    });

    if (infoResponse.status !== 200 || infoResponse.data?.error || infoResponse.data?.ok === false) {
      return null;
    }

    const result = infoResponse.data?.result;

    if (!result?.code) {
      return {
        valid: true,
        kind: AddressKind.WALLET,
        isNative: false,
        isToken: false,
        isContract: false,
        address,
      };
    }

    // Contract detected — check if it is a Jetton master (fungible token)
    // by calling the mandatory get_jetton_data getter. exit_code 0 = success.
    try {
      const jettonResponse = await axios.post(
        `${baseUrl}/runGetMethod`,
        { address, method: 'get_jetton_data', stack: [] },
        { validateStatus: (status) => status < 500 },
      );
      if (jettonResponse.data?.result?.exit_code === 0) {
        return {
          valid: true,
          kind: AddressKind.TOKEN,
          isNative: false,
          isToken: true,
          isContract: true,
          address,
        };
      }
    } catch {
      // runGetMethod network error — fall through to CONTRACT
    }

    return {
      valid: true,
      kind: AddressKind.CONTRACT,
      isNative: false,
      isToken: false,
      isContract: true,
      address,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`RPC error (TON getAddressInformation): ${message}`);
    return null;
  }
}
