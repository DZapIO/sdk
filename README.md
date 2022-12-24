⚙️ Quick start

Install Dzap core SDK using:

npm install @dzap/dzap-core

or

yarn add @dzap/dzap-core

Initialize dzap SDK:

Make sure to pass chainId & respective write provider to enable contract call.
```
import DZap from "@dzap/dzap-core";

const provider = new ethers.providers.JsonRpcProvider("");
const chainId = 1
const client = new DZap({
  chainId,
  provider,
});
```
After initialization you may call : 

1. getQuoteRate
2. swap

Ex : getQuoteRate 

to call getQuoteRate you must pass request in the format given below -
```
const request = [
  {
    amount: "1000000000000000000", // in wei
    fromTokenAddress: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
    slippage: 1,
    toTokenAddress: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
  },
]

const result = await client.getQuoteRate(request);

```

Ex : swap 

this will require to pass request & recipient address

here recipient is the address on which you wish to transfer tokens after swap.
```
const result = await client.swap(request, recipient);

```
This method will ask to sign transactions  