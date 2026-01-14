import { PermitTypes } from './permit';

const { EIP2612Permit: _, ...permitModeWithoutKey } = PermitTypes;

export const ApprovalModes = {
  ...permitModeWithoutKey,
  Default: 'Default',
} as const;
