import { secp256k1 } from '@noble/curves/secp256k1';
import { networks, payments, Psbt } from 'bitcoinjs-lib';
import { exclusiveChainIds } from '../../../src/constants/chains';
import { StatusCodes, TxnStatus } from '../../../src/enums';
import { bvmAdapter } from '../../../src/transactionHandlers/adapters/bvm';
import { TradeBuildTxnRequest, TradeBuildTxnResponse } from '../../../src/types';
import { BtcSignPsbtParams } from '../../../src/types/signer';

jest.mock('../../../src/api', () => ({ broadcastTradeTx: jest.fn(), broadcastZapTx: jest.fn() }));

import { broadcastTradeTx, broadcastZapTx } from '../../../src/api';

const broadcast = broadcastTradeTx as jest.Mock;
const broadcastZap = broadcastZapTx as jest.Mock;

const privateKey = secp256k1.utils.randomPrivateKey();
const publicKey = secp256k1.getPublicKey(privateKey, true);
const xOnlyKey = publicKey.subarray(1, 33);
const p2wpkh = payments.p2wpkh({ pubkey: publicKey, network: networks.bitcoin });
// a p2tr output is the x-only key behind OP_1, which is enough to test the input preparation without an ecc lib
const p2trScript = Uint8Array.from([0x51, 0x20, ...xOnlyKey]);

const keyPair = {
  publicKey,
  sign: (hash: Uint8Array) => secp256k1.sign(hash, privateKey, { lowS: true }).toCompactRawBytes(),
};

const buildPsbt = (script: Uint8Array) =>
  new Psbt({ network: networks.bitcoin })
    .addInput({ hash: 'aa'.repeat(32), index: 0, witnessUtxo: { script, value: BigInt(10_000) } })
    .addOutput({ address: p2wpkh.address as string, value: BigInt(9_000) })
    .toBase64();

const signerWith = (signPsbt: (params: BtcSignPsbtParams) => Promise<string>) => ({
  account: { address: p2wpkh.address as string, publicKey: Buffer.from(publicKey).toString('hex') },
  signPsbt,
});

const signWithKey = async ({ psbt }: BtcSignPsbtParams) => Psbt.fromHex(psbt).signInput(0, keyPair).toHex();

const send = (signPsbt: (params: BtcSignPsbtParams) => Promise<string>, script: Uint8Array, build: Partial<TradeBuildTxnResponse> = {}) =>
  bvmAdapter.sendTrade({
    chainId: exclusiveChainIds.btc,
    signer: signerWith(signPsbt),
    request: {} as TradeBuildTxnRequest,
    txnData: { txId: 'txId', data: buildPsbt(script), ...build } as TradeBuildTxnResponse,
  });

describe('bitcoin trade sending', () => {
  beforeEach(() => {
    broadcast.mockReset();
    broadcastZap.mockReset();
  });

  it('signs the psbt, finalizes it and broadcasts the raw tx through the api', async () => {
    broadcast.mockResolvedValue({ status: TxnStatus.success, txnHash: 'txid' });
    const signPsbt = jest.fn(signWithKey);

    await expect(send(signPsbt, p2wpkh.output as Uint8Array)).resolves.toEqual({ txnHash: 'txid' });

    expect(signPsbt).toHaveBeenCalledWith(
      expect.objectContaining({ inputsToSign: [{ address: p2wpkh.address, sigHash: 1, signingIndexes: [0] }], finalize: false }),
    );
    const [{ chainId, txId, txData }] = broadcast.mock.calls[0];
    expect({ chainId, txId }).toEqual({ chainId: exclusiveChainIds.btc, txId: 'txId' });
    expect(txData).toMatch(/^02000000/);
  });

  it('adds the taproot internal key and sighash a wallet needs to sign a p2tr input', async () => {
    let signed: BtcSignPsbtParams | undefined;
    const rejection = Object.assign(new Error('User rejected the request.'), { code: StatusCodes.UserRejectedRequest });
    const signPsbt = jest.fn(async (params: BtcSignPsbtParams) => {
      signed = params;
      throw rejection;
    });

    await expect(send(signPsbt, p2trScript)).rejects.toBe(rejection);

    const input = Psbt.fromHex(signed?.psbt as string).data.inputs[0];
    expect(Buffer.from(input.tapInternalKey as Uint8Array)).toEqual(Buffer.from(xOnlyKey));
    expect(input.sighashType).toBe(1);
    expect(signed?.inputsToSign[0].address).toMatch(/^bc1p/);
  });

  it('throws the reason the api gives for a failed broadcast', async () => {
    broadcast.mockResolvedValue({ status: TxnStatus.error, message: 'bad-txns-inputs-missingorspent' });

    await expect(send(signWithKey, p2wpkh.output as Uint8Array)).rejects.toMatchObject({
      code: StatusCodes.Error,
      message: 'bad-txns-inputs-missingorspent',
    });
  });

  it('refuses a lightning trade, which is paid to an invoice', async () => {
    const btclnTxData = { paymentRequestType: 'bolt11' as const, paymentRequest: 'lnbc1', paymentExpiry: 0 };

    await expect(send(signWithKey, p2wpkh.output as Uint8Array, { btclnTxData })).rejects.toMatchObject({ code: StatusCodes.InvalidRequest });
  });

  it('broadcasts a zap step through the zap api with the step txnId', async () => {
    broadcastZap.mockResolvedValue({ status: TxnStatus.success, data: { txnHash: 'zapTxid', txnId: '0x01' } });

    const result = await bvmAdapter.sendZapStep({
      chainId: exclusiveChainIds.btc,
      signer: signerWith(signWithKey),
      step: { type: 'bvm', txnId: '0x01', data: buildPsbt(p2wpkh.output as Uint8Array) },
    });

    expect(result).toEqual({ txnHash: 'zapTxid' });
    expect(broadcastZap).toHaveBeenCalledWith(expect.objectContaining({ chainId: exclusiveChainIds.btc, txId: '0x01' }));
    expect(broadcast).not.toHaveBeenCalled();
  });
});
