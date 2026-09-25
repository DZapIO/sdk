import { exclusiveChainIds } from '../../src/constants/chains';
import { StatusCodes, TxnStatus } from '../../src/enums';
import { bvmAdapter } from '../../src/transactionHandlers/adapters/bvm';
import { evmAdapter } from '../../src/transactionHandlers/adapters/evm';
import ZapTxnHandler from '../../src/transactionHandlers/zap';
import { zapStepAction } from '../../src/zap/constants/step';

const request = { srcChainId: exclusiveChainIds.btc } as never;
const btcSigner = { account: { address: 'bc1q', publicKey: '02' }, signPsbt: jest.fn() };
const bvmStep = { action: zapStepAction.execute, data: { type: 'bvm' as const, txnId: '0x01' as const, data: 'psbt' } };

describe('zap dispatch', () => {
  afterEach(() => jest.restoreAllMocks());

  it('sends each execute step with the adapter of the chain type it names', async () => {
    const sendZapStep = jest.spyOn(bvmAdapter, 'sendZapStep').mockResolvedValue({ txnHash: 'txid' });
    const approveStep = { action: 'approve', data: bvmStep.data } as never;

    const result = await ZapTxnHandler.zap({ request, steps: [approveStep, bvmStep], signer: btcSigner, rpcUrls: ['https://rpc'] });

    expect(result).toEqual({ status: TxnStatus.success, code: StatusCodes.Success, txnHash: 'txid' });
    expect(sendZapStep).toHaveBeenCalledTimes(1);
    expect(sendZapStep).toHaveBeenCalledWith({ chainId: exclusiveChainIds.btc, signer: btcSigner, step: bvmStep.data, rpcUrls: ['https://rpc'] });
  });

  it('takes a step without a chain type to be evm', async () => {
    const sendZapStep = jest.spyOn(evmAdapter, 'sendZapStep').mockResolvedValue({ txnHash: '0xhash' });
    const walletClient = { transport: {}, request: jest.fn() };
    const data = { callTo: '0x1', callData: '0x', value: '0', estimatedGas: '0' };

    const result = await ZapTxnHandler.zap({ request, steps: [{ action: zapStepAction.execute, data } as never], signer: walletClient as never });

    expect(result).toMatchObject({ status: TxnStatus.success, txnHash: '0xhash' });
    expect(sendZapStep).toHaveBeenCalled();
  });

  it('refuses a signer of another chain type', async () => {
    const result = await ZapTxnHandler.zap({ request, steps: [bvmStep], signer: { signTransaction: jest.fn() } });

    expect(result).toMatchObject({ status: TxnStatus.error, code: StatusCodes.InvalidRequest, errorMsg: 'The signer cannot sign bvm transactions' });
  });

  it('reports a route without execute steps', async () => {
    const result = await ZapTxnHandler.zap({ request, steps: [{ ...bvmStep, action: 'approve' } as never], signer: btcSigner });

    expect(result).toMatchObject({ status: TxnStatus.error, code: StatusCodes.InvalidRequest });
  });
});
