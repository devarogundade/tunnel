import algosdk from 'algosdk';
import * as algokit from '@algorandfoundation/algokit-utils';

export const ASSET_ID = 472701447;
export const TUNNEL_ID = 472699436;
export const TUNNEL_ADDR = 'XBZAZIWPBJHO76DEUFKW55EIVKAL7EUZVN55R64ZVV4NDUFWPZIKBILEKY';

// Signing Key
const handlerAlgoKey = process.env.ALGO_PRIVATE_KEY!!;

const algodClient = algokit.getAlgoClient({
    server: 'https://testnet-api.algonode.cloud'
});

const METHODS = [
    new algosdk.ABIMethod({ name: "receiveMessage", desc: "", args: [{ type: "uint64", name: "nonce", desc: "" }, { type: "asset", name: "asset", desc: "" }, { type: "uint64", name: "amount", desc: "" }, { type: "address", name: "receiver", desc: "" }], returns: { type: "void", desc: "" } }),
];

export async function signTransaction(nonce: number, assetId: number, ammout: string, receiver: string): Promise<string | null> {
    try {
        const account = algokit.mnemonicAccount(handlerAlgoKey);

        const suggestedParams = await algodClient.getTransactionParams().do();

        const appCall = algosdk.makeApplicationNoOpTxnFromObject({
            appIndex: TUNNEL_ID,
            from: account.addr,
            appArgs: [
                algosdk.getMethodByName(METHODS, 'receiveMessage').getSelector(),
                algosdk.encodeUint64(nonce),
                algosdk.encodeUint64(ASSET_ID),
                algosdk.encodeUint64(BigInt(ammout)),
                algosdk.decodeAddress(receiver).publicKey
            ],
            accounts: [receiver],
            foreignAssets: [ASSET_ID],
            suggestedParams: { ...suggestedParams, fee: algokit.algos(0.0015).microAlgos },
        });

        const signedTxn = algosdk.signTransaction(appCall, account.sk);

        const { txId } = await algodClient.sendRawTransaction(signedTxn.blob).do();

        await algosdk.waitForConfirmation(algodClient, txId, 3);

        console.log(txId);

        return txId;
    } catch (error) {
        console.error(error);
        return null;
    }
}