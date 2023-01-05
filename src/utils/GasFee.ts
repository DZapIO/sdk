import Web3 from "web3";
import { HISTORICAL_BLOCK, JSON_RPC_PROVIDER } from "./../constants";

const meanGasFee = (arr: any) => {
  const sum = arr.reduce((a: number, b: number) => a + b);
  return Math.round(sum / arr.length);
};

export const formatFeeHistory = (result: any) => {
  try {
    let blockNumber = Number(result.oldestBlock);
    let index = 0;
    const formattedFeeHistory = [];
    const loopLen = Number(result.oldestBlock) + result.reward.length;
    while (blockNumber < loopLen) {
      formattedFeeHistory.push({
        blockNumber,
        baseFeePerGas: Number(result.baseFeePerGas[index]),
        gasUsedRatio: Number(result.gasUsedRatio[index]),
        priorityFeePerGas: result.reward[index].map((x: any) => Number(x)),
      });
      blockNumber += 1;
      index += 1;
    }
    return formattedFeeHistory;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getNetworkFee = async (chainId: number) => {
  const web3 = new Web3(
    new Web3.providers.HttpProvider(JSON_RPC_PROVIDER[chainId])
  );
  try {
    const feeHistory = await web3.eth.getFeeHistory(
      HISTORICAL_BLOCK,
      "latest",
      [1, 50, 99]
    );

    const lowIndex = 0;
    const avgIndex = 1;
    const highIndex = 2;

    const formattedFeeHistory = formatFeeHistory(feeHistory);

    const low = meanGasFee(
      formattedFeeHistory.map((item) => item.priorityFeePerGas[lowIndex])
    );
    const medium = meanGasFee(
      formattedFeeHistory.map((item) => item.priorityFeePerGas[avgIndex])
    );
    const high = meanGasFee(
      formattedFeeHistory.map((item) => item.priorityFeePerGas[highIndex])
    );
    const blockData = await web3.eth.getBlock("pending");
    const baseFeePerGas = Number(
      blockData.baseFeePerGas || (await web3.eth.getGasPrice())
    );

    return {
      low: low + baseFeePerGas,
      medium: medium + baseFeePerGas,
      high: high + baseFeePerGas,
    };
  } catch (error) {
    const baseFeePerGas = +(await web3.eth.getGasPrice());
    return {
      low: baseFeePerGas,
      medium: baseFeePerGas + Math.round((baseFeePerGas * 10) / 100),
      high: baseFeePerGas + Math.round((baseFeePerGas * 15) / 100),
    };
  }
};
