export const STATUS_RESPONSE = {
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  PENDING: 'PENDING',
  PARTIAL_SUCCESS: 'PARTIAL_SUCCESS',
  REFUNDED: 'REFUNDED',
} as const;

export const STATUS = {
  pending: 'pending',
  inProgress: 'in-progress',
  success: 'success',
  rejected: 'rejected',
  error: 'error',
} as const;
