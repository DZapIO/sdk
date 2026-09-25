import { Signer } from 'ethers';
import { WalletClient } from 'viem';
import { executeGaslessTxnData, fetchTradeBuildTxnData } from '../api';
import { chainTypes } from '../constants/chains';
import { PermitTypes } from '../constants/permit';
import { ContractVersion, StatusCodes, TxnStatus } from '../enums';
import { DZapTransactionResponse, GaslessTradeBuildTxnResponse, HexString, TradeBuildTxnRequest, TradeBuildTxnResponse } from '../types';
import { DZapSigner } from '../types/signer';
import { DZapTxnError, toTxnErrorResponse } from '../utils/errors';
import { getChainAdapterFor } from './adapters';
import PermitTxnHandler from './permit';

class TradeTxnHandler {
  /**
   * Builds the trade unless `txnData` is given, and sends it with the adapter of the source chain's type.
   */
  public static buildAndSendTransaction = async ({
    request,
    signer,
    txnData,
    multicallAddress,
    batchTransaction = false,
    rpcUrls,
    chainType = chainTypes.evm,
  }: {
    request: TradeBuildTxnRequest;
    signer: DZapSigner;
    txnData?: TradeBuildTxnResponse;
    batchTransaction: boolean;
    multicallAddress?: HexString;
    rpcUrls?: string[];
    chainType?: string;
  }): Promise<DZapTransactionResponse> => {
    try {
      const adapter = getChainAdapterFor(chainType, signer);
      const build = txnData ?? ((await fetchTradeBuildTxnData(request)) as TradeBuildTxnResponse);
      const { txnHash } = await adapter.sendTrade({
        chainId: request.fromChain,
        signer,
        request,
        txnData: build,
        rpcUrls,
        batchTransaction,
        multicallAddress,
      });
      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
        txnHash: txnHash as HexString,
        additionalInfo: build.additionalInfo,
        updatedQuotes: build.updatedQuotes,
      };
    } catch (error) {
      console.log({ error });
      return toTxnErrorResponse(error);
    }
  };

  public static buildGaslessTxAndSignPermit = async ({
    request,
    signer,
    rpcUrls,
    spender,
    txnData,
    txnStatusCallback,
  }: {
    request: TradeBuildTxnRequest;
    signer: Signer | WalletClient;
    rpcUrls: string[];
    spender: HexString;
    txnData?: GaslessTradeBuildTxnResponse;
    txnStatusCallback?: (status: TxnStatus) => void;
  }): Promise<DZapTransactionResponse> => {
    try {
      const chainId = request.fromChain;

      let buildTxnResponseData: GaslessTradeBuildTxnResponse;
      if (txnData) {
        buildTxnResponseData = txnData;
      } else {
        buildTxnResponseData = await fetchTradeBuildTxnData({
          ...request,
          gasless: true,
        });
      }

      const permitType = request.hasPermit2ApprovalForAllTokens ? PermitTypes.PermitBatchWitnessTransferFrom : PermitTypes.EIP2612Permit;

      const txId = buildTxnResponseData.txId;
      const resp = await PermitTxnHandler.signGaslessUserIntent({
        tokens: request.data.map((req, index) => {
          return {
            address: req.srcToken as HexString,
            amount: req.amount,
            index: index,
          };
        }),
        chainId,
        rpcUrls,
        sender: request.sender,
        spender,
        permitType,
        signer,
        gasless: true,
        txId,
        service: 'trade',
        contractVersion: ContractVersion.v2,
        ...buildTxnResponseData.transaction,
      });

      if (resp.status === TxnStatus.success && resp.data) {
        if (txnStatusCallback) {
          txnStatusCallback(TxnStatus.waitingForExecution);
        }
        const permit =
          resp.data.type === PermitTypes.EIP2612Permit
            ? {
                permitData: request.data.map((req) => {
                  return {
                    token: req.srcToken as HexString,
                    amount: req.amount,
                    permit: req.permitData as HexString,
                  };
                }),
                gaslessIntentNonce: resp.data.nonce?.toString(),
                gaslessIntentSignature: resp.data.signature,
                gaslessIntentDeadline: resp.data.deadline?.toString(),
              }
            : {
                batchPermitData: resp.data.batchPermitData,
              };
        const gaslessTxResp: {
          status: TxnStatus;
          txnHash: HexString;
        } = await executeGaslessTxnData({
          chainId: request.fromChain,
          txId,
          permit,
        });
        if (gaslessTxResp.status !== TxnStatus.success) {
          throw new DZapTxnError(StatusCodes.Error, 'The DZap API failed to execute the gasless transaction');
        }
        return {
          status: TxnStatus.success,
          code: StatusCodes.Success,
          txnHash: gaslessTxResp.txnHash as HexString,
        };
      }
      // the permit signer already mapped the wallet's error to a status and code
      const rejected = resp.status === TxnStatus.rejected;
      return {
        status: rejected ? TxnStatus.rejected : TxnStatus.error,
        code: resp.code ?? StatusCodes.Error,
        errorMsg: rejected ? 'Rejected by User' : 'Failed to sign the gasless trade',
      };
    } catch (error) {
      console.log({ error });
      return toTxnErrorResponse(error);
    }
  };
}

export default TradeTxnHandler;
