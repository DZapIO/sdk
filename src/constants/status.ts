/**
 * Status values returned from API responses
 */
export const STATUS_RESPONSE = {
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  PENDING: 'PENDING',
  PARTIAL_SUCCESS: 'PARTIAL_SUCCESS',
  REFUNDED: 'REFUNDED',
} as const;

/**
 * Internal status values for tracking transaction state
 */
export const STATUS = {
  success: 'success',
  pending: 'pending',
  rejected: 'rejected',
  inProgress: 'in-progress',
  error: 'error',
} as const;
