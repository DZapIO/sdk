import { TypedDataField } from 'ethers';
import { PermitBatchTransferFromValues, PermitSingleValues, PermitTransferFromValues, WitnessData } from 'src/types/permit';
import type { Address, TypedDataDomain } from 'viem';
import { permit2Domain } from './domain.js';

type PermitSingleData = {
  domain: TypedDataDomain;
  types: Record<string, Array<TypedDataField>>;
  message: PermitSingleValues;
};

type PermitTransferFromData = {
  domain: TypedDataDomain;
  types: Record<string, Array<TypedDataField>>;
  message: PermitTransferFromValues;
};

type PermitBatchTransferFromData = {
  domain: TypedDataDomain;
  types: Record<string, Array<TypedDataField>>;
  message: PermitBatchTransferFromValues;
};

function isPermitSingle(permit: PermitTransferFromValues | PermitBatchTransferFromValues | PermitSingleValues): permit is PermitSingleValues {
  return 'details' in permit && permit.details !== undefined;
}

function isPermitTransferFrom(
  permit: PermitTransferFromValues | PermitBatchTransferFromValues | PermitSingleValues,
): permit is PermitTransferFromValues {
  return 'permitted' in permit && !Array.isArray(permit.permitted);
}

export function getPermitSingleData(permit: PermitSingleValues, permit2Address: Address, chainId: number): PermitSingleData {
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
  permit: PermitTransferFromValues,
  permit2Address: Address,
  chainId: number,
  witness: WitnessData,
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
  permit: PermitBatchTransferFromValues,
  permit2Address: Address,
  chainId: number,
  witness: WitnessData,
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
  permit: PermitTransferFromValues | PermitBatchTransferFromValues | PermitSingleValues,
  permit2Address: Address,
  chainId: number,
  witness?: WitnessData,
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
