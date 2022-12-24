import { expect } from "chai";
import {
  createSDKInstance,
  getAccount,
  getRequest,
  INVALID_CHAIN_ID,
} from "./utils";

const { assert } = require("chai");
const request = getRequest();

describe("Negative case", () => {
  let client;
  before(() => {
    client = createSDKInstance(INVALID_CHAIN_ID);
  });

  it("1. Try to fetch unsupported chainId contract address", async () => {
    assert.throws(client.getContractAddress, Error, "Unsupported chainId");
  });

  it("2. Try to create unsupported chainId contract", async () => {
    // assert.throws(client.getContract(), Error);
    expect(client.getContract()).to.throw(Error);
  });

  it("3. Test swap method", async () => {
    assert.throws(await client.swap(request, getAccount()), Error);
  }).timeout(100000);
});
