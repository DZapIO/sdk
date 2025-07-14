import { PermitType } from 'src/enums';
import { encodeAbiParameters, parseAbiParameters } from 'viem';

export const STATUS = {
  pending: 'pending',
  inProgress: 'in-progress',
  success: 'success',
  rejected: 'rejected',
  error: 'error',
};

export const ERRORS = {
  NOT_FOUND: 'Request not found',
};

export const DZapAbis = {
  dZapCoreAbi: 'dZapCoreAbi',
  dZapDcaAbi: 'dZapDcaAbi',
} as const;

export const OtherAbis = {
  permit2: 'permit2',
  erc20: 'erc20',
} as const;

export const Services = {
  trade: 'trade',
  dca: 'dca',
  zap: 'zap',
} as const;

export const QuoteFilters = {
  fastest: 'fastest',
  best: 'best',
  all: 'all',
} as const;

export const HISTORICAL_BLOCK = 10;

export const NATIVE_TOKEN_DECIMAL = 18;
export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const dZapNativeTokenFormat = ZERO_ADDRESS;

export const PERMIT_TYPEHASH_CONST = '0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9';
export const DEFAULT_PERMIT_DATA = encodeAbiParameters(parseAbiParameters('uint8, bytes'), [PermitType.PERMIT, '0x']);
export const DEFAULT_PERMIT2_DATA = encodeAbiParameters(parseAbiParameters('uint8, bytes'), [PermitType.PERMIT2_APPROVE, '0x']);

export const STATUS_RESPONSE = {
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  PENDING: 'PENDING',
  PARTIAL_SUCCESS: 'PARTIAL_SUCCESS',
  REFUNDED: 'REFUNDED',
} as const;
