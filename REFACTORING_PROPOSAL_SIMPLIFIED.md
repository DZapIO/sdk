# SignatureService Refactoring Proposal - Simplified

## Executive Summary

A simplified refactoring plan that reduces complexity while maintaining class-based architecture. All logic stays within classes - no standalone functions.

## Simplified Architecture

### Core Principle
- **Everything in classes** - No standalone functions
- **Simple handlers** - One class per permit type, no abstract base
- **Factory method** - Inside SignatureService, not separate class
- **Minimal patterns** - Just handlers and a facade

## Proposed Structure

```
SignatureService (Instance-based Facade)
├── createHandler() - Factory method
└── handlers/
    ├── EIP2612Handler
    ├── Permit2Handler
    ├── BatchPermitHandler
    └── GaslessHandler
```

## Detailed Design

### 1. SignatureService (Main Facade)

```typescript
/**
 * Main service for signature operations
 * Instance-based with dependency injection
 */
export class SignatureService {
  constructor(
    private chainsService: ChainsService,
    private contractsService: ContractsService,
    private permit2Service: Permit2Service
  ) {}

  /**
   * Factory method to create appropriate handler
   */
  private createHandler(params: PermitParams): PermitHandler {
    // Handle native tokens
    if (isDZapNativeToken(params.tokens[0]?.address)) {
      return new NativeTokenHandler();
    }

    // Handle batch permits
    if (this.shouldUseBatchPermit(params)) {
      return new BatchPermitHandler(
        this.chainsService,
        this.contractsService,
        this.permit2Service
      );
    }

    // Determine permit type
    const permitType = this.resolvePermitType(params);
    
    switch (permitType) {
      case PermitTypes.EIP2612Permit:
        return new EIP2612Handler(
          this.chainsService,
          this.contractsService,
          this.permit2Service
        );
      case PermitTypes.PermitWitnessTransferFrom:
        return new Permit2Handler(
          this.chainsService,
          this.contractsService,
          this.permit2Service
        );
      default:
        throw new Error(`Unsupported permit type: ${permitType}`);
    }
  }

  /**
   * Main entry point for permit signing
   */
  async signPermit(params: GasSignatureParams): Promise<SignPermitResponse> {
    if (params.tokens.length === 0) {
      return this.buildEmptyResponse(params.permitType);
    }

    const handler = this.createHandler(params);
    return handler.handle(params);
  }

  /**
   * Sign gasless user intent
   */
  async signGaslessUserIntent(params: GaslessSignatureParams): Promise<GaslessIntentResponse> {
    const handler = new GaslessHandler(
      this.chainsService,
      this.contractsService
    );
    return handler.handle(params);
  }

  /**
   * Sign custom typed data
   */
  async signCustomTypedData(params: CustomTypedDataParams): Promise<CustomTypedDataResponse> {
    const handler = new CustomTypedDataHandler();
    return handler.handle(params);
  }

  private resolvePermitType(params: PermitParams): PermitMode {
    if (params.permitType === PermitTypes.AutoPermit) {
      return this.detectOptimalPermitType(params);
    }
    return params.permitType;
  }

  private async detectOptimalPermitType(params: PermitParams): Promise<PermitMode> {
    const eip2612Support = await getEIP2612PermitData({
      address: params.tokens[0].address,
      chainId: params.chainId,
      rpcUrls: params.rpcUrls,
      permit: params.tokens[0].permit,
    });

    return eip2612Support.supportsPermit
      ? PermitTypes.EIP2612Permit
      : PermitTypes.PermitWitnessTransferFrom;
  }

  private shouldUseBatchPermit(params: PermitParams): boolean {
    return (
      params.isBatchPermitAllowed &&
      params.tokens.length > 1 &&
      !isOneToMany(params.tokens[0].address, params.tokens[1].address) &&
      !this.v1PermitSupport({ contractVersion: params.contractVersion, service: params.service })
    );
  }

  private v1PermitSupport({ contractVersion, service }: { contractVersion: ContractVersion; service: AvailableDZapServices }): boolean {
    return contractVersion === ContractVersion.v1 && service !== Services.zap;
  }
}
```

### 2. Handler Classes (Simple, No Abstract Base)

```typescript
/**
 * Base interface for all handlers
 * Simple contract - no abstract class complexity
 */
interface PermitHandler {
  handle(params: PermitParams): Promise<PermitResponse>;
}

/**
 * EIP2612 Permit Handler
 * Handles EIP-2612 permit signing
 */
class EIP2612Handler implements PermitHandler {
  constructor(
    private chainsService: ChainsService,
    private contractsService: ContractsService,
    private permit2Service: Permit2Service
  ) {}

  async handle(params: PermitParams): Promise<PermitResponse> {
    try {
      const { token, chainId, rpcUrls, account, spender, signer, contractVersion, service } = params;
      
      const eip2612Data = await getEIP2612PermitData({
        address: token.address,
        chainId,
        rpcUrls,
        owner: account,
        permit: token.permit,
      });

      if (!eip2612Data.supportsPermit || !eip2612Data.data) {
        throw new Error('Token does not support EIP-2612 permits');
      }

      const deadline = generateDeadline(SIGNATURE_EXPIRY_IN_SECS);
      const amount = BigInt(token.amount || maxUint256);
      
      const domain = token?.permit?.eip2612?.data?.domain || {
        name: eip2612Data.data.name,
        version: eip2612Data.data.version,
        chainId,
        verifyingContract: token.address,
      };

      const message = {
        owner: account,
        spender,
        value: amount,
        nonce: eip2612Data.data.nonce,
        deadline,
      };

      const signature = await signTypedData({
        signer,
        domain,
        message,
        types: EIP2612DefaultTypes,
        account,
        primaryType: 'Permit',
      });

      const sig = ethers.utils.splitSignature(signature);
      const dZapPermitData = this.encodePermitData({
        account,
        spender,
        amount,
        deadline,
        sig,
        contractVersion,
        service,
      });

      const permitData = encodeAbiParameters(
        parseAbiParameters('uint8, bytes'),
        [DZapPermitMode.PERMIT, dZapPermitData]
      );

      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
        permitData,
        nonce: BigInt(0),
        permitType: PermitTypes.EIP2612Permit,
      };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  private encodePermitData(params: {
    account: string;
    spender: string;
    amount: bigint;
    deadline: bigint;
    sig: { v: number; r: string; s: string };
    contractVersion: ContractVersion;
    service: AvailableDZapServices;
  }): HexString {
    const { account, spender, amount, deadline, sig, contractVersion, service } = params;
    
    return contractVersion === ContractVersion.v1 && service !== Services.zap
      ? ethers.utils.defaultAbiCoder.encode(
          ['address', 'address', 'uint256', 'uint256', 'uint8', 'bytes32', 'bytes32'],
          [account, spender, amount, deadline, sig.v, sig.r, sig.s]
        )
      : ethers.utils.defaultAbiCoder.encode(
          ['uint256', 'uint8', 'bytes32', 'bytes32'],
          [deadline, sig.v, sig.r, sig.s]
        );
  }

  private handleError(error: unknown): PermitResponse {
    const err = error as { cause?: { code?: StatusCodes }; code?: StatusCodes };
    if (err?.cause?.code === StatusCodes.UserRejectedRequest || err?.code === StatusCodes.UserRejectedRequest) {
      return { status: TxnStatus.rejected, code: StatusCodes.UserRejectedRequest, permitType: PermitTypes.EIP2612Permit };
    }
    return { status: TxnStatus.error, code: StatusCodes.Error, permitType: PermitTypes.EIP2612Permit };
  }
}

/**
 * Permit2 Handler
 * Handles Permit2 permit signing
 */
class Permit2Handler implements PermitHandler {
  constructor(
    private chainsService: ChainsService,
    private contractsService: ContractsService,
    private permit2Service: Permit2Service
  ) {}

  async handle(params: PermitParams): Promise<PermitResponse> {
    try {
      const {
        chainId,
        account,
        tokens,
        spender,
        rpcUrls,
        deadline: sigDeadline,
        signer,
        permitType,
        firstTokenNonce,
        contractVersion,
        service,
      } = params;

      const deadline = sigDeadline ?? generateDeadline(SIGNATURE_EXPIRY_IN_SECS);
      const expiration = params.expiration ?? maxUint256;
      const permit2Address = this.permit2Service.getAddress(chainId);

      const normalizedTokens = tokens.map((token) => ({
        ...token,
        amount: BigInt(token.amount || maxUint256).toString(),
      }));

      const witnessData = this.permit2Service.buildWitnessData(params);
      const { permit2Values, nonce } = await this.permit2Service.buildPermitValues({
        primaryType: permitType,
        spender,
        account,
        deadline,
        chainId,
        permit2Address,
        rpcUrls,
        tokens: normalizedTokens,
        expiration,
        firstTokenNonce: firstTokenNonce ?? null,
        service,
        contractVersion,
      });

      const typedData = this.permit2Service.buildTypedData(
        permit2Values,
        permit2Address,
        chainId,
        witnessData
      );

      const signature = await signTypedData({
        signer,
        domain: typedData.domain,
        message: typedData.message,
        types: typedData.types,
        account,
        primaryType: permitType,
      });

      const encodedTransferData = this.permit2Service.encodeTransferData({
        permitType,
        tokens: normalizedTokens,
        nonce,
        deadline,
        expiration,
        signature,
        contractVersion,
        service,
      });

      const permitMode = this.permit2Service.getPermitMode(service, contractVersion, permitType);
      const permitData = encodeAbiParameters(
        parseAbiParameters('uint8, bytes'),
        [permitMode, encodedTransferData]
      );

      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
        permitData,
        nonce,
        permitType,
      };
    } catch (error: unknown) {
      return this.handleError(error, params.permitType);
    }
  }

  private handleError(error: unknown, permitType: PermitMode): PermitResponse {
    const err = error as { cause?: { code?: StatusCodes }; code?: StatusCodes };
    if (err?.cause?.code === StatusCodes.UserRejectedRequest || err?.code === StatusCodes.UserRejectedRequest) {
      return { status: TxnStatus.rejected, code: StatusCodes.UserRejectedRequest, permitType };
    }
    return { status: TxnStatus.error, code: StatusCodes.Error, permitType };
  }
}

/**
 * Batch Permit Handler
 * Extends Permit2Handler for batch operations
 */
class BatchPermitHandler extends Permit2Handler {
  async handle(params: PermitParams): Promise<BatchPermitResponse> {
    if (params.tokens.length < 2) {
      throw new Error('Batch permit requires at least 2 tokens');
    }

    const response = await super.handle({
      ...params,
      permitType: PermitTypes.PermitBatchWitnessTransferFrom,
    });

    return {
      ...response,
      permitType: PermitTypes.PermitBatchWitnessTransferFrom,
    };
  }
}

/**
 * Gasless Intent Handler
 * Handles gasless transaction signatures
 */
class GaslessHandler {
  constructor(
    private chainsService: ChainsService,
    private contractsService: ContractsService
  ) {}

  async handle(params: GaslessSignatureParams): Promise<GaslessIntentResponse> {
    try {
      const { chainId, spender, account, signer, rpcUrls, txType } = params;
      const deadline = params.deadline || generateDeadline(SIGNATURE_EXPIRY_IN_SECS);

      const contract = getContract({
        abi: this.contractsService.getDZapAbi('trade', params.contractVersion),
        address: spender,
        client: this.chainsService.getPublicClient(chainId, rpcUrls),
      });

      const nonce = (await contract.read.getNonce([account])) as bigint;

      const domain = {
        name: EIP2612_GASLESS_DOMAIN.name,
        version: EIP2612_GASLESS_DOMAIN.version,
        chainId,
        verifyingContract: spender,
        salt: EIP2612_GASLESS_DOMAIN.salt,
      };

      const { message, types, primaryType } = this.buildTypedData({
        ...params,
        deadline,
        nonce,
      });

      const signature = await signTypedData({
        signer,
        domain,
        message,
        types,
        account,
        primaryType,
      });

      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
        data: {
          signature,
          nonce,
          deadline,
        },
      };
    } catch (error: unknown) {
      logger.error('Failed to sign gasless intent', {
        service: 'GaslessHandler',
        method: 'handle',
        chainId: params.chainId,
        txType: params.txType,
        error,
      });
      return handleViemTransactionError({ error });
    }
  }

  private buildTypedData(params: Gasless2612PermitParams & { nonce: bigint }) {
    const { account, deadline, nonce, swapDataHash, txType } = params;

    if (txType === GASLESS_TX_TYPE.swap) {
      return {
        message: {
          txId: params.txId,
          user: account,
          executorFeesHash: params.executorFeesHash,
          swapDataHash: params.swapDataHash,
          nonce,
          deadline,
        },
        types: DzapUserIntentSwapTypes,
        primaryType: DZapIntentPrimaryTypes.SignedGasLessSwapData,
      };
    }

    if (swapDataHash) {
      return {
        message: {
          txId: params.txId,
          user: account,
          nonce,
          deadline,
          executorFeesHash: params.executorFeesHash,
          swapDataHash: params.swapDataHash,
          adapterDataHash: params.adapterDataHash,
        },
        types: DzapUserIntentSwapBridgeTypes,
        primaryType: DZapIntentPrimaryTypes.SignedGasLessSwapBridgeData,
      };
    }

    return {
      message: {
        txId: params.txId,
        user: account,
        nonce,
        deadline,
        executorFeesHash: params.executorFeesHash,
        adapterDataHash: params.adapterDataHash,
      },
      types: DzapUserIntentBridgeTypes,
      primaryType: DZapIntentPrimaryTypes.SignedGasLessBridgeData,
    };
  }
}

/**
 * Custom Typed Data Handler
 * Handles custom typed data signing
 */
class CustomTypedDataHandler {
  async handle(params: CustomTypedDataParams): Promise<CustomTypedDataResponse> {
    try {
      const { account, signer, message, domain, primaryType, types } = params;

      const signature = await signTypedData({
        signer,
        account,
        domain,
        message,
        primaryType,
        types,
      });

      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
        data: {
          signature,
          message,
        },
      };
    } catch (error: unknown) {
      logger.error('Failed to sign custom typed data', {
        service: 'CustomTypedDataHandler',
        method: 'handle',
        error,
      });
      return handleViemTransactionError({ error });
    }
  }
}

/**
 * Native Token Handler
 * Handles native token permits (no-op)
 */
class NativeTokenHandler implements PermitHandler {
  async handle(params: PermitParams): Promise<PermitResponse> {
    return {
      status: TxnStatus.success,
      code: StatusCodes.Success,
      permitData: DEFAULT_PERMIT_DATA,
      nonce: BigInt(0),
      permitType: PermitTypes.EIP2612Permit,
    };
  }
}
```

## Key Simplifications

### Removed Complexity
1. ❌ **No Abstract Base Class** - Just simple interface, handlers are independent
2. ❌ **No Template Method Pattern** - Each handler implements its own flow
3. ❌ **No Separate Factory Class** - Factory method inside SignatureService
4. ❌ **No Strategy Pattern** - Simple switch/if statements
5. ❌ **No Builder Pattern** - Direct object construction
6. ❌ **No Chain of Responsibility** - Simple factory method

### What We Keep
1. ✅ **Class-based** - Everything in classes
2. ✅ **Single Responsibility** - Each handler has one job
3. ✅ **Dependency Injection** - Services injected via constructor
4. ✅ **Simple Interface** - `PermitHandler` interface for consistency
5. ✅ **Instance-based** - No static methods

## Benefits

### Simplicity
- **Fewer classes** - 5 handlers + 1 facade vs 10+ classes in original proposal
- **No inheritance complexity** - Only BatchPermitHandler extends Permit2Handler
- **Clear flow** - Easy to follow from SignatureService → Handler → Response

### Maintainability
- **Easy to understand** - Each class is self-contained
- **Easy to test** - Mock dependencies, test handlers independently
- **Easy to extend** - Add new handler class, update factory method

### Code Quality
- **SOLID principles** - Single responsibility, dependency injection
- **Type safety** - Strong typing throughout
- **Error handling** - Consistent error handling in each handler

## Migration Path

### Phase 1: Create New Structure (Non-breaking)
1. Create handler classes alongside existing code
2. Create new SignatureService with instance methods
3. Add comprehensive tests

### Phase 2: Gradual Migration
1. Update call sites to use instance-based SignatureService
2. Keep old static methods as wrappers (deprecated)
3. Migrate one handler at a time

### Phase 3: Cleanup
1. Remove old static methods
2. Remove deprecated code
3. Update all documentation

## Example Usage

```typescript
// Initialize service with dependencies
const signatureService = new SignatureService(
  chainsService,
  contractsService,
  permit2Service
);

// Sign permit - factory automatically selects handler
const result = await signatureService.signPermit({
  chainId: 1,
  sender: '0x...',
  tokens: [{ address: '0x...', amount: '1000' }],
  signer: walletClient,
  service: Services.trade,
  permitType: PermitTypes.AutoPermit,
});

// Sign gasless intent
const gaslessResult = await signatureService.signGaslessUserIntent({
  chainId: 1,
  sender: '0x...',
  tokens: [{ address: '0x...', amount: '1000' }],
  signer: walletClient,
  txType: GASLESS_TX_TYPE.swap,
  txId: '0x...',
});
```

## Comparison

| Aspect | Original Proposal | Simplified Proposal |
|--------|------------------|---------------------|
| Classes | 10+ classes | 6 classes |
| Patterns | 5+ patterns | 1 pattern (facade) |
| Abstract Base | Yes | No |
| Factory | Separate class | Method in facade |
| Complexity | High | Low |
| Lines of Code | ~800 | ~500 |

## Conclusion

This simplified approach:
- ✅ Reduces complexity significantly
- ✅ Keeps everything in classes
- ✅ Maintains SOLID principles
- ✅ Easy to understand and maintain
- ✅ Easy to test and extend
- ✅ No unnecessary abstractions

The architecture is simpler while still providing all the benefits of the original proposal.

