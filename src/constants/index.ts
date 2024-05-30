import { PermitType } from 'src/enums';
import { HexString } from 'src/types';
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

export const HISTORICAL_BLOCK = 10;

export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const PERMIT_TYPEHASH_CONST = '0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9';
export const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3' as HexString;
export const DEFAULT_PERMIT_DATA = encodeAbiParameters(parseAbiParameters('uint8, bytes'), [PermitType.PERMIT, '0x']);
export const PERMIT2_APPROVE_DATA = encodeAbiParameters(parseAbiParameters('uint8, bytes'), [PermitType.PERMIT2_APPROVE, '0x']);
