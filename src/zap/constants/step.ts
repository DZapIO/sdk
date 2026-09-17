export const zapStepAction = {
  execute: 'execute',
  approve: 'approve',
  sign: 'sign',
  broadcast: 'broadcast',
} as const;

export const zapSignStepKind = {
  perpsActions: 'perpsActions',
  limitOrder: 'limitOrder',
} as const;

export const zapBroadcastMode = {
  onchain: 'onchain',
  offchain: 'offchain',
} as const;

export const zapPreExecutionStepType = {
  sign: 'sign',
} as const;
