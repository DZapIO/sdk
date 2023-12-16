import DzapClient from './client';
import useClient from './hooks/useClient';
import useContract from './hooks/useContract';
// Test Scripts
// import { TestGetQuoteRate, TestGetSwapParams } from './test';

// TestGetQuoteRate();
// TestGetSwapParams();
export default DzapClient;

export { useClient, useContract };
