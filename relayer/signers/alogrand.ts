import algosdk from 'algosdk';
import * as algokit from '@algorandfoundation/algokit-utils';

export const TUNNEL_ID = 478376514;
export const TUNNEL_ADDR = 'I3V5SKQY4D74PDB5UFASOQ6VPVBLF25TNLVKQ3JCDB4CKHZW5YPXQTBQ4Q';

// Signing Key
const handlerAlgoKey = process.env.ALGO_PRIVATE_KEY!!;

const algodClient = algokit.getAlgoClient({
    server: 'https://testnet-api.algonode.cloud'
});

const METHODS = [
    new algosdk.ABIMethod({ name: "receiveMessage", desc: "", args: [{ type: "uint64", name: "nonce", desc: "" }, { type: "asset", name: "asset", desc: "" }, { type: "uint64", name: "amount", desc: "" }, { type: "address", name: "receiver", desc: "" }], returns: { type: "void", desc: "" } }),
];

export async function signTransaction(nonce: number, ASSET_ID: number, amount: string, receiver: string): Promise<string | null> {
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
                algosdk.encodeUint64(BigInt(amount)),
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


export function decodeOnAlgo(input: string): { assetId: number, amount: number, receiver: string; } {
    // Extracting the different parts of the input string
    const assetIdHex = input.slice(0, 16);
    const amountHex = input.slice(16, 32);
    const receiverHex = input.slice(32);

    // Converting hex strings to numbers and encoding the receiver address
    const assetId = Number(`0x${assetIdHex}`);
    const amount = Number(`0x${amountHex}`);
    const receiver = algosdk.encodeAddress(algosdk.bigIntToBytes(BigInt(`0x${receiverHex}`), 32));

    return { assetId, amount, receiver };
}