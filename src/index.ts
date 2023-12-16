import UseClientSingleton from './client';
import useClient from './hooks/useClient';
import useContract from './hooks/useContract';
// Test Scripts
// import { TestGetQuoteRate, TestGetSwapParams } from './test';

// TestGetQuoteRate();
// TestGetSwapParams();
export default UseClientSingleton;

export { useClient, useContract };
