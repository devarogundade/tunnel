import algosdk from 'algosdk';
import * as algokit from '@algorandfoundation/algokit-utils';

// App ID
export const TunnelId = 468699439;
const TunnelAcct = 'MYW7T3Q6RJAMMQBEDDZNPDLNCJITEJ22KTMKD4NNW363BZN374TCCE6G3Q';


// Signing Key
const handlerAlgoKey = process.env.ALGO_PRIVATE_KEY!!;

const algodClient = algokit.getAlgoClient({
    server: 'https://testnet-api.algonode.cloud'
});

signTransaction(0, 468701001, '', 'NKVYROUJZXKSVMAB6IXWZZFRBYMLTO3FQESGEHBRWNOFSDP3KZDY3BCE5I');

const methods = [
    new algosdk.ABIMethod({ name: "receiveMessage", desc: "", args: [{ type: "uint64", name: "nonce", desc: "" }, { type: "asset", name: "asset", desc: "" }, { type: "uint64", name: "amount", desc: "" }, { type: "account", name: "receiver", desc: "" }], returns: { type: "void", desc: "" } }),
];

export async function signTransaction(nonce: number, assetId: number, ammout: string, receiver: string): Promise<string | null> {
    try {
        const account = algokit.mnemonicAccount(handlerAlgoKey);

        const suggestedParams = await algodClient.getTransactionParams().do();

        const appCall = algosdk.makeApplicationNoOpTxnFromObject({
            appIndex: TunnelId,
            from: account.addr,
            appArgs: [
                algosdk.getMethodByName(methods, 'receiveMessage').getSelector(),
                algosdk.encodeUint64(nonce),
                algosdk.encodeUint64(assetId),
                algosdk.encodeUint64(1_000_000),
                algosdk.decodeAddress(receiver).publicKey
            ],
            accounts: [receiver],
            foreignAssets: [assetId],
            suggestedParams: { ...suggestedParams, fee: algokit.algos(0.0015).microAlgos }
        });

        const signedTxn = algosdk.signTransaction(appCall, account.sk);

        const { txId } = await algodClient.sendRawTransaction(signedTxn.blob).do();

        console.log(txId);

        return txId;
    } catch (error) {
        console.error(error);
        return null;
    }
}