import type { Address } from 'viem';
import { permit2Domain } from './domain.js';
import {
  PermitBatchTransferFrom,
  PermitBatchTransferFromData,
  PermitSingle,
  PermitSingleData,
  PermitTransferFrom,
  PermitTransferFromData,
  Witness,
} from '../../types/permit.js';

function isPermitSingle(permit: PermitTransferFrom | PermitBatchTransferFrom | PermitSingle): permit is PermitSingle {
  return 'details' in permit && permit.details !== undefined;
}

function isPermitTransferFrom(permit: PermitTransferFrom | PermitBatchTransferFrom | PermitSingle): permit is PermitTransferFrom {
  return 'permitted' in permit && !Array.isArray(permit.permitted);
}

export function getPermitSingleData(permit: PermitSingle, permit2Address: Address, chainId: number): PermitSingleData {
  const domain = permit2Domain(permit2Address, chainId);

  const types = {
    PermitSingle: [
      { name: 'details', type: 'PermitDetails' },
      { name: 'spender', type: 'address' },
      { name: 'sigDeadline', type: 'uint256' },
    ],
    PermitDetails: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint160' },
      { name: 'expiration', type: 'uint48' },
      { name: 'nonce', type: 'uint48' },
    ],
  };

  const message = permit;

  return {
    domain,
    types,
    message,
  };
}

export function getPermitTransferData(
  permit: PermitTransferFrom,
  permit2Address: Address,
  chainId: number,
  witness: Witness,
): PermitTransferFromData {
  const domain = permit2Domain(permit2Address, chainId);

  const types = {
    ...witness.witnessType,
    TokenPermissions: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    PermitWitnessTransferFrom: [
      { name: 'permitted', type: 'TokenPermissions' },
      { name: 'spender', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'witness', type: witness.witnessTypeName },
    ],
  };

  const message = Object.assign(permit, { witness: witness.witness });

  return {
    domain,
    types,
    message,
  };
}

export function getPermitBatchTransferData(
  permit: PermitBatchTransferFrom,
  permit2Address: Address,
  chainId: number,
  witness: Witness,
): PermitBatchTransferFromData {
  const domain = permit2Domain(permit2Address, chainId);

  const types = {
    ...witness.witnessType,
    TokenPermissions: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    PermitBatchWitnessTransferFrom: [
      { name: 'permitted', type: 'TokenPermissions[]' },
      { name: 'spender', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'witness', type: witness.witnessTypeName },
    ],
  };
  const message = Object.assign(permit, { witness: witness.witness });
  return {
    domain,
    types,
    message,
  };
}

export function getPermit2Data(
  permit: PermitTransferFrom | PermitBatchTransferFrom | PermitSingle,
  permit2Address: Address,
  chainId: number,
  witness?: Witness,
): PermitTransferFromData | PermitBatchTransferFromData | PermitSingleData {
  if (isPermitSingle(permit)) {
    return getPermitSingleData(permit, permit2Address, chainId);
  }
  if (!witness) {
    throw new Error('Witness is required for PermitTransferFrom');
  }
  if (isPermitTransferFrom(permit)) {
    return getPermitTransferData(permit, permit2Address, chainId, witness);
  }
  return getPermitBatchTransferData(permit, permit2Address, chainId, witness);
}
