import {
  fetchAllSupportedChains,
} from '../api';

function useClient({ chainId }: { chainId: number }) {

  const getAllSupportedChains = () => {
    return fetchAllSupportedChains(chainId);
  };

  return {
    getAllSupportedChains,
  };
}
export default useClient;
