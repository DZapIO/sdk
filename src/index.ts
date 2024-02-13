import DzapClient from './client';
import useContract from './hooks/useContract';
import {
  GetSwapParamsResponse,
  HexString,
  ChainIds,
  SwapParamRequest,
  SwapData,
  SwapRequest,
  QuoteRateRequest,
} from './types';
// import { TestHook } from './test';
// Test Scripts
// import { TestGetQuoteRate, TestGetSwapParams } from './test';
// TestHook();
// TestGetQuoteRate();
// TestGetSwapParams();
export default DzapClient;

export {
  useContract,
  HexString,
  ChainIds,
  GetSwapParamsResponse,
  SwapParamRequest,
  SwapData,
  SwapRequest,
  QuoteRateRequest,
};
