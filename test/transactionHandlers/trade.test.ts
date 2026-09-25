import { exclusiveChainIds } from '../../src/constants/chains';
import { StatusCodes, TxnStatus } from '../../src/enums';
import { evmAdapter } from '../../src/transactionHandlers/adapters/evm';
import { svmAdapter } from '../../src/transactionHandlers/adapters/svm';
import TradeTxnHandler from '../../src/transactionHandlers/trade';
import { TradeBuildTxnRequest, TradeBuildTxnResponse } from '../../src/types';
import { DZapTxnError } from '../../src/utils/errors';

const request = { fromChain: exclusiveChainIds.solana, data: [] } as unknown as TradeBuildTxnRequest;
const build = {
  txId: 'txId',
  data: 'base64Tx',
  from: 'user',
  additionalInfo: { pair: { some: 'info' } },
  updatedQuotes: { pair: '100' },
} as unknown as TradeBuildTxnResponse;
const svmSigner = { signTransaction: jest.fn() };

const trade = (chainType: string, signer: object) =>
  TradeTxnHandler.buildAndSendTransaction({ request, signer: signer as never, txnData: build, batchTransaction: false, chainType });

describe('trade dispatch', () => {
  afterEach(() => jest.restoreAllMocks());

  it('sends a trade with the adapter of its chain type and returns the quote info with the hash', async () => {
    const sendTrade = jest.spyOn(svmAdapter, 'sendTrade').mockResolvedValue({ txnHash: 'signature' });

    const result = await trade('svm', svmSigner);

    expect(sendTrade).toHaveBeenCalledWith(expect.objectContaining({ chainId: exclusiveChainIds.solana, signer: svmSigner, txnData: build }));
    expect(result).toEqual({
      status: TxnStatus.success,
      code: StatusCodes.Success,
      txnHash: 'signature',
      additionalInfo: build.additionalInfo,
      updatedQuotes: build.updatedQuotes,
    });
  });

  it('refuses a signer that cannot sign for the chain type before sending anything', async () => {
    const sendTrade = jest.spyOn(evmAdapter, 'sendTrade');

    const result = await trade('evm', svmSigner);

    expect(result).toMatchObject({ status: TxnStatus.error, code: StatusCodes.InvalidRequest, errorMsg: 'The signer cannot sign evm transactions' });
    expect(sendTrade).not.toHaveBeenCalled();
  });

  it('refuses a chain type no adapter serves', async () => {
    const result = await trade('tonvm', svmSigner);

    expect(result).toMatchObject({
      status: TxnStatus.error,
      code: StatusCodes.InvalidRequest,
      errorMsg: 'Transactions on tonvm chains are not supported',
    });
  });

  it('turns what the adapter throws into the error response', async () => {
    jest
      .spyOn(svmAdapter, 'sendTrade')
      .mockRejectedValue(new DZapTxnError(StatusCodes.TransactionNotConfirmed, 'Transaction was not confirmed in time', { txnHash: 'signature' }));

    const result = await trade('svm', svmSigner);

    expect(result).toMatchObject({ status: TxnStatus.error, code: StatusCodes.TransactionNotConfirmed, txnHash: 'signature' });
  });
});
