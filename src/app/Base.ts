import Axios from "axios";
import { baseUrl } from "../config";
import { Constructor } from "../types";

export abstract class Base {
  protected clientId: number;
  protected nftId: number;
  protected chainId: number;
  protected provider: any;

  constructor(config: Constructor) {
    this.clientId = config.clientId || 0;
    this.nftId = config.nftId || 0;
    this.chainId = config.chainId;
    this.provider = config.provider;
  }

  protected invoke<T>(endpint: string, data: any): Promise<T> {
    const url = `${baseUrl}${endpint}`;
    return Axios({
      method: "put",
      url,
      data,
    })
      .then(({ data }) => data)
      .catch((error) => Promise.reject(error));
  }
}
