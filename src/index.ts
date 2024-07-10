import DzapClient from './client';
import {
  ApiRpcResponse,
  BridgeParamsRequest,
  BridgeParamsResponse,
  BridgeQuoteRequest,
  BridgeQuoteResponse,
  Chain,
  ChainData,
  GetSwapParamsResponse,
  HexString,
  SwapData,
  SwapParamsRequest,
  SwapQuoteData,
  SwapQuoteRequest,
  SwapQuoteResponse,
  PermitSelectorData,
} from './types';
import { PermitSelector, Erc20Functions, PermitType, TxnState, StatusCodes, PermitFunctionSelector } from './enums';
import { Services, OtherAbis } from './constants';
// import { TestHook } from './test';
// Test Scripts
// import { TestGetQuoteRate, TestGetSwapParams } from './test';
// TestHook();
// TestGetQuoteRate();
// TestGetSwapParams();
export default DzapClient;

export {
  ApiRpcResponse,
  BridgeParamsRequest,
  BridgeParamsResponse,
  BridgeQuoteRequest,
  BridgeQuoteResponse,
  Chain,
  ChainData,
  GetSwapParamsResponse,
  HexString,
  SwapData,
  SwapParamsRequest,
  SwapQuoteData,
  SwapQuoteRequest,
  SwapQuoteResponse,
  Services,
  OtherAbis,
  PermitSelector,
  PermitSelectorData,
  PermitType,
  PermitFunctionSelector,
  TxnState as TxnStatus,
  StatusCodes,
  Erc20Functions,
};
