// import {
//     createSDKInstance,
//     getContract,
//     getContractAddress,
//     getRequest,
//     VALID_CHAIN_ID
// } from "./utils";

// const { expect } = require("chai");
// const request = getRequest();

// describe("Positive case", () => {
//   let client;

//   before(() => {
//     client = createSDKInstance(VALID_CHAIN_ID);
//   });

//   it("1. Verifiy constructor", async () => {
//     expect(client.getContractAddress()).equal(getContractAddress());
//     expect(client.getContract().address).eql(getContract().address);
//   });

//   it("2. Test Get quote rate api", async () => {
//     const result = await client.getQuoteRate(request);
//     expect(result.length).to.equal(request.length);
//   }).timeout(100000);

//   it("3. Test Swap params api", async () => {
//     const result = await client.getSwapParams(request);
//     expect(result.ercSwapDetails.length).to.equal(request.length);
//     // input & output param validation
//   }).timeout(100000);
// });
