import { Signer } from 'ethers';
import { WalletClient } from 'viem';
import { StatusCodes, TxnStatus } from '../enums';
import { HexString } from '../types';
import { isTypeSigner } from '../utils';
import { viemChainsById } from '../chains';
import { handleViemTransactionError } from '../utils/errors';

class GenericTxnHandler {
  public static sendTransaction = async ({
    chainId,
    signer,
    from,
    to,
    data,
    value,
  }: {
    chainId: number;
    signer: Signer | WalletClient;
    from: HexString;
    to: HexString;
    data: HexString;
    value: string;
  }) => {
    try {
      if (isTypeSigner(signer)) {
        console.log('Using ethers signer.');
        const txnRes = await signer.sendTransaction({
          from,
          to,
          data,
          value,
        });
        return {
          status: TxnStatus.success,
          code: StatusCodes.Success,
          txnHash: txnRes.hash as HexString,
        };
      } else {
        console.log('Using viem walletClient.');
        const txnHash = await signer.sendTransaction({
          chain: viemChainsById[chainId],
          account: from as HexString,
          to: to as HexString,
          data: data as HexString,
          value: BigInt(value),
        });
        return {
          status: TxnStatus.success,
          code: StatusCodes.Success,
          txnHash,
        };
      }
    } catch (error: any) {
      console.log({ error });
      return handleViemTransactionError({ error });
    }
  };
}

export default GenericTxnHandler;
