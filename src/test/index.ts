import useClient from "../hooks/useClient";
import useContract from "../hooks/useContract";

const TEST_CHAIN_ID = {
    chainId: 137
};

const requests = [
    {
        "amount": "12000000000000000000",
        "fromTokenAddress": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        "toTokenAddress": "0xa3fa99a148fa48d14ed51d610c367c61876997f1",
        "slippage": 1,
        "globalAmount": "12",
        "account": "0x03356ef8674b07d9698daf96cc2b3ccd1ce0170e"
    }
]


async function TestGetQuoteRate() {
    let response;
    const { getQuoteRate: getQuoteRateUsingDZapClient } = useClient(TEST_CHAIN_ID);
    try {
        response = await getQuoteRateUsingDZapClient(
            requests,
        );
    } catch (e) {
        console.log(e, "request error ")
    }

    console.log(response)

}

export default TestGetQuoteRate;