import { providers } from "ethers";
import { useEffect, useState } from "react";
import DZap from "../app";
import { Request } from "../app/api/types";

function useClient({ chainId, rpc }: { chainId: number; rpc: string }) {
  const [client, setClient] = useState<DZap>();

  const init = () => {
    const readOnlyProvider = new providers.JsonRpcProvider(rpc);
    const dZap = new DZap({
      chainId,
      provider: readOnlyProvider,
    });
    setClient(dZap);
  };
  
  useEffect(() => {
    init();
  }, [chainId, rpc]);

  const getQuoteRate = async (request: Request[]) => {
    return await client.getQuoteRate(request);
  };

  const getSwapParams = async (request: Request[]) => {
    return client.getSwapParams(request);
  };

  return {
    getQuoteRate,
    getSwapParams,
  };
}
export default useClient;
