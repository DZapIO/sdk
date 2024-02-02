import useContract from 'src/hooks/useContract';
import { ethers } from 'ethers';
const TEST_CHAIN_ID = {
  chainId: 42161,
};

const quoteRequests = {
  chainId: 137,
  integrator: 'dzap',
  request: [
    {
      amount: '200000000000000000',
      fromTokenAddress: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
      toTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      slippage: 1,
      globalAmount: '0.2',
      account: '0x12480616436dd6d555f88b8d94bb5156e28825b1',
    },
    {
      amount: '200000000000000000',
      fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      toTokenAddress: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
      slippage: 1,
      globalAmount: '0.2',
      account: '0x12480616436dd6d555f88b8d94bb5156e28825b1',
    },
  ],
};

const paramRequest = {
  chainId: 42161,
  data: [
    {
      account: '0x5cab52349c051908c1dc621d15eb7f608dc80634',
      sourceId: 'paraSwap',
      globalAmount: '0.000015',
      amount: '15000000000000',
      srcToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      dstToken: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
      slippage: 1,
    },
  ],
  recipient: '0x5cab52349c051908c1dc621d15eb7f608dc80634',
  integratorId: 'dzap',
  refundee: '0x5cab52349c051908c1dc621d15eb7f608dc80634',
  sender: '0x5cab52349c051908c1dc621d15eb7f608dc80634',
};

export async function TestGetQuoteRate() {
  let response;
  console.log('TestGetQuoteRate');
  const { getQuoteRate: getQuoteRateUsingDZapClient } =
    useClient(TEST_CHAIN_ID);
  try {
    response = await getQuoteRateUsingDZapClient(quoteRequests);
  } catch (e) {
    console.log(e, 'request error ');
  }

  console.log(response);
}

export async function TestGetSwapParams() {
  let response;
  console.log('TestGetSwapParams');
  const { getSwapParams: getParamUsingDZapClient } = useClient(TEST_CHAIN_ID);
  try {
    response = await getParamUsingDZapClient(paramRequest);
  } catch (e) {
    console.log(e, 'request error ');
  }

  console.log(response);
}

const PRIVATE_KEY: string = '';

export async function TestHook() {
  console.log('Testing now...');
  const provider = new ethers.providers.JsonRpcProvider(
    'https://arb-mainnet.g.alchemy.com/v2/HxHVTDRB9UrZQNXBHC2tigcAAk03i7bb', //Arbitrum
  );
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  const { swap } = useContract({ chainId: 42161, signer: signer });
  try {
    const resp = await swap({ request: paramRequest });
    console.log(resp);
  } catch (e) {
    console.log(e);
  }
}
