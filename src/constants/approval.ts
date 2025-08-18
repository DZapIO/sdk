import { PermitTypes } from './permit';

const { ...permitModeWithoutKey } = PermitTypes;

export const ApprovalModes = {
  ...permitModeWithoutKey,
  Default: 'Default',
} as const;
