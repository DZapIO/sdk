import { ethers } from "ethers";
import { Endpoints } from "./app/api/Endpoints";
import { Base } from "./app/Base";
import { Contract } from "./app/contract/Contract";
import { applyMixins } from "./utils/index";

class DZap extends Base {}
interface DZap extends Endpoints {}
interface DZap extends Contract {}

applyMixins(DZap, [Endpoints, Contract]);

export default DZap;

async function startServer() {
  console.log("start");

  const provider = new ethers.providers.JsonRpcProvider("");

  const client = new DZap({
    chainId: 1377,
    provider: provider,
  });

  const request = [
    {
      amount: "1000000000000000000",
      fromTokenAddress: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
      slippage: 1,
      toTokenAddress: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    },
  ];
  console.log(client.getContract());

  //   client
  //     .swap(request, "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063")
  //     .then((res) => {
    

  //       console.log(res);
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //     });
}


startServer();
