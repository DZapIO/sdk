import { Signer } from 'ethers';
import { maxUint256 } from 'viem';
import { ApprovalModes } from '../../../src/constants/approval';
import { dZapNativeTokenFormat } from '../../../src/constants';
import { DEFAULT_PERMIT2_ADDRESS } from '../../../src/constants/contract';
import { StatusCodes, TxnStatus } from '../../../src/enums';
import { AllowanceTypes } from '../../../src/types/permit';
import * as utils from '../../../src/utils';
import { approveToken, batchGetAllowances, getAllowance } from '../../../src/utils/erc20';
import * as multicallModule from '../../../src/utils/multicall';
import { arbitrumOne, arbitrumUsdc, arbitrumWeth, LIVE_TEST_TIMEOUT_MS, permit2, sampleAccounts } from '../../fixtures/realWorld';

describe('utils/erc20', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('live Arbitrum reads', () => {
    it(
      'batchGetAllowances reads USDC allowance for Permit2 via multicall',
      async () => {
        const result = await batchGetAllowances({
          chainId: arbitrumOne.chainId,
          rpcUrls: [arbitrumOne.rpc],
          owner: sampleAccounts.testWallet,
          data: [{ token: arbitrumUsdc.address, spender: permit2.defaultAddress }],
        });

        expect(result.status).toBe(TxnStatus.success);
        expect(result.code).toBe(StatusCodes.Success);
        expect(result.data[arbitrumUsdc.address]).toEqual(expect.any(BigInt));
      },
      LIVE_TEST_TIMEOUT_MS,
    );

    it(
      'getAllowance returns live USDC allowance in Default mode',
      async () => {
        const dzapSpender = '0x0000000000000000000000000000000000000001' as `0x${string}`;

        const result = await getAllowance({
          chainId: arbitrumOne.chainId,
          rpcUrls: [arbitrumOne.rpc],
          sender: sampleAccounts.testWallet,
          spender: dzapSpender,
          mode: ApprovalModes.Default,
          tokens: [{ address: arbitrumUsdc.address, amount: '1000000' }],
        });

        expect(result.status).toBe(TxnStatus.success);
        expect(result.data[arbitrumUsdc.address]).toEqual({
          allowance: expect.any(BigInt),
          type: AllowanceTypes.dzap,
        });
      },
      LIVE_TEST_TIMEOUT_MS,
    );

    it(
      'getAllowance resolves AutoPermit to EIP-2612 for Arbitrum USDC',
      async () => {
        const dzapSpender = '0x0000000000000000000000000000000000000001' as `0x${string}`;

        const result = await getAllowance({
          chainId: arbitrumOne.chainId,
          rpcUrls: [arbitrumOne.rpc],
          sender: sampleAccounts.testWallet,
          spender: dzapSpender,
          mode: ApprovalModes.AutoPermit,
          tokens: [{ address: arbitrumUsdc.address, amount: '1000000' }],
        });

        expect(result.status).toBe(TxnStatus.success);
        expect(result.data[arbitrumUsdc.address]).toEqual({
          allowance: maxUint256,
          type: AllowanceTypes.eip2612,
        });
      },
      LIVE_TEST_TIMEOUT_MS,
    );

    it(
      'getAllowance uses Permit2 spender in PermitSingle mode',
      async () => {
        const dzapSpender = '0x0000000000000000000000000000000000000001' as `0x${string}`;

        const result = await getAllowance({
          chainId: arbitrumOne.chainId,
          rpcUrls: [arbitrumOne.rpc],
          sender: sampleAccounts.testWallet,
          spender: dzapSpender,
          mode: ApprovalModes.PermitSingle,
          tokens: [{ address: arbitrumUsdc.address, amount: '1000000' }],
        });

        expect(result.status).toBe(TxnStatus.success);
        expect(result.data[arbitrumUsdc.address]).toEqual({
          allowance: expect.any(BigInt),
          type: AllowanceTypes.permit2,
        });
      },
      LIVE_TEST_TIMEOUT_MS,
    );

    it('getAllowance assigns maxUint256 to native tokens without RPC', async () => {
      const result = await getAllowance({
        chainId: arbitrumOne.chainId,
        sender: sampleAccounts.testWallet,
        spender: sampleAccounts.zeroLike,
        mode: ApprovalModes.Default,
        tokens: [{ address: dZapNativeTokenFormat, amount: '1000000' }],
      });

      expect(result.status).toBe(TxnStatus.success);
      expect(result.data[dZapNativeTokenFormat]).toEqual({
        allowance: maxUint256,
        type: AllowanceTypes.dzap,
      });
    });
  });

  describe('error paths', () => {
    it('batchGetAllowances returns empty data when multicall fails', async () => {
      jest.spyOn(multicallModule, 'multicall').mockResolvedValue({
        status: TxnStatus.error,
        code: StatusCodes.Error,
        data: [],
      });

      const result = await batchGetAllowances({
        chainId: arbitrumOne.chainId,
        owner: sampleAccounts.testWallet,
        data: [{ token: arbitrumUsdc.address, spender: permit2.defaultAddress }],
      });

      expect(result.status).toBe(TxnStatus.error);
      expect(result.data).toEqual({});
    });

    it('getAllowance returns error when batchGetAllowances throws', async () => {
      jest.spyOn(multicallModule, 'multicall').mockRejectedValue(new Error('rpc down'));

      const result = await getAllowance({
        chainId: arbitrumOne.chainId,
        sender: sampleAccounts.testWallet,
        spender: sampleAccounts.zeroLike,
        mode: ApprovalModes.Default,
        tokens: [{ address: arbitrumUsdc.address, amount: '1' }],
      });

      expect(result.status).toBe(TxnStatus.error);
      expect(result.code).toBe(StatusCodes.Error);
    });
  });

  describe('approveToken', () => {
    const baseParams = {
      chainId: arbitrumOne.chainId,
      mode: ApprovalModes.Default,
      tokens: [{ address: arbitrumUsdc.address, amount: '1000000' }],
      spender: sampleAccounts.zeroLike,
    };

    it('routes Default mode approvals to the provided spender via writeContract', async () => {
      const writeContract = jest.spyOn(utils, 'writeContract').mockResolvedValue({
        status: TxnStatus.success,
        code: StatusCodes.Success,
        txnHash: '0xhash',
      });

      const result = await approveToken({
        ...baseParams,
        signer: {} as any,
      });

      expect(result.status).toBe(TxnStatus.success);
      expect(writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          contractAddress: arbitrumUsdc.address,
          args: [sampleAccounts.zeroLike, '1000000'],
        }),
      );
    });

    it('routes non-Default mode approvals to Permit2', async () => {
      const writeContract = jest.spyOn(utils, 'writeContract').mockResolvedValue({
        status: TxnStatus.success,
        code: StatusCodes.Success,
        txnHash: '0xhash',
      });

      await approveToken({
        ...baseParams,
        mode: ApprovalModes.PermitSingle,
        signer: {} as any,
      });

      expect(writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [DEFAULT_PERMIT2_ADDRESS, '1000000'],
        }),
      );
    });

    it('returns early when writeContract fails', async () => {
      jest.spyOn(utils, 'writeContract').mockResolvedValue({
        status: TxnStatus.error,
        code: StatusCodes.Error,
        txnHash: '',
      });

      const result = await approveToken({
        ...baseParams,
        signer: {} as any,
      });

      expect(result.status).toBe(TxnStatus.error);
      expect(result.code).toBe(StatusCodes.Error);
    });

    it('returns early when approvalTxnCallback rejects the txn', async () => {
      jest.spyOn(utils, 'writeContract').mockResolvedValue({
        status: TxnStatus.success,
        code: StatusCodes.Success,
        txnHash: '0xhash',
      });

      const result = await approveToken({
        ...baseParams,
        signer: {} as any,
        approvalTxnCallback: async () => TxnStatus.rejected,
      });

      expect(result.status).toBe(TxnStatus.success);
      expect(result.code).toBe(StatusCodes.Success);
    });

    it('uses ethers Signer.sendTransaction for Signer instances', async () => {
      const sendTransaction = jest.fn().mockResolvedValue({});
      const signer = Object.create(Signer.prototype);
      signer.getAddress = jest.fn().mockResolvedValue(sampleAccounts.testWallet);
      signer.sendTransaction = sendTransaction;

      const result = await approveToken({
        ...baseParams,
        signer,
      });

      expect(result.status).toBe(TxnStatus.success);
      expect(sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          to: arbitrumUsdc.address,
          chainId: arbitrumOne.chainId,
        }),
      );
    });

    it('approves multiple tokens sequentially', async () => {
      const writeContract = jest.spyOn(utils, 'writeContract').mockResolvedValue({
        status: TxnStatus.success,
        code: StatusCodes.Success,
        txnHash: '0xhash',
      });

      await approveToken({
        ...baseParams,
        tokens: [
          { address: arbitrumUsdc.address, amount: '100' },
          { address: arbitrumWeth.address, amount: '200' },
        ],
        signer: {} as any,
      });

      expect(writeContract).toHaveBeenCalledTimes(2);
    });
  });
});
