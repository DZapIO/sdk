import { providers } from "ethers";
import { useEffect, useState } from "react";
import DZap from "../app";
import { Request } from "../app/api/types";

function useContract({
  chainId,
  provider,
  clientId,
  nftId,
}: {
  chainId: number;
  provider?: providers.Provider;
  clientId?: number;
  nftId?: number;
}) {
  const [contract, setContract] = useState<DZap>();

  const init = () => {
    const dZap = new DZap({
      chainId,
      provider,
      clientId,
      nftId,
    });
    setContract(dZap);
  };
  useEffect(() => {
    init();
  }, [provider, clientId, nftId]);

  const swap = async (request: Request[], recipient: string) => {
    return await contract.swap(request, recipient);
  };

  const getContractAddress = () => {
    return contract.getContractAddress();
  };

  return {
    contract,
    swap,
    getContractAddress,
  };
}
export default useContract;
