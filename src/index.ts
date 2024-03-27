import DzapClient from './client';
import useContract from './hooks/useContract';
import {
  GetSwapParamsResponse,
  ChainIds,
  ChainData,
  Chain,
  ApiRpcResponse,
  SwapParamsRequest,
  SwapData,
  SwapQuoteData,
  SwapQuoteRequest,
  SwapQuoteResponse,
  HexString,
  BridgeQuoteRequest,
  BridgeParamsRequest,
  BridgeQuoteResponse,
  BridgeParamsResponse,
} from './types';
// import { TestHook } from './test';
// Test Scripts
// import { TestGetQuoteRate, TestGetSwapParams } from './test';
// TestHook();
// TestGetQuoteRate();
// TestGetSwapParams();
export default DzapClient;

export {
  HexString,
  useContract,
  ChainIds,
  ChainData,
  Chain,
  ApiRpcResponse,
  GetSwapParamsResponse,
  SwapParamsRequest,
  SwapData,
  SwapQuoteData,
  SwapQuoteRequest,
  SwapQuoteResponse,
  BridgeQuoteRequest,
  BridgeParamsRequest,
  BridgeQuoteResponse,
  BridgeParamsResponse,
};
