import { PermitTypes } from './permit';

const { EIP2612Permit, ...permitModeWithoutKey } = PermitTypes;

export const ApprovalModes = {
  ...permitModeWithoutKey,
  Default: 'Default',
} as const;
