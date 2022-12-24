import { Base } from "../Base";
import { GetSwapParamsResponse, Request } from "./types";

export class Endpoints extends Base {
  getQuoteRate(request: Request[]): Promise<any> {
    return this.invoke("swap/get-path", {
      chainId: this.chainId,
      requests: request,
    });
  }
  getSwapParams(request: Request[]): Promise<GetSwapParamsResponse> {
    return this.invoke("swap/get-params", {
      chainId: this.chainId,
      swapParams: request,
    });
  }
}
