import algosdk from 'algosdk';
import * as algokit from '@algorandfoundation/algokit-utils';
import appspec from '../../algorand/smart_contracts/artifacts/TunnelFi/application.json';

const tunnelId = 1;
const tunnel = new algosdk.ABIContract(appspec.contract);

// Signing Key and Address
const handlerAlgoKey = process.env.ALGO_PRIVATE_KEY!!;
const handlerAlgoAddress = process.env.ALGO_PUBLIC_KEY!!;

const algodClient = algokit.getAlgoClient({
    server: 'https://testnet-api.algonode.cloud'
});

export async function signTransaction(nonce: number, assetId: number, ammout: string, receiver: string): Promise<string | null> {
    const account = algokit.mnemonicAccount(handlerAlgoKey);

    const suggestedParams = await algodClient.getTransactionParams().do();
    const fee = suggestedParams.fee * 3;

    const args = [new Uint8Array()];

    const txn = algosdk.makeApplicationCallTxnFromObject({
        appIndex: 0,
        appArgs: args,
        from: handlerAlgoAddress,
        foreignAssets: [],
        suggestedParams: { ...suggestedParams, fee: fee, flatFee: true },
        onComplete: algosdk.OnApplicationComplete.NoOpOC
    })

    try {
        const signedTxn =  txn.signTxn(account.sk);
        const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
        
        console.log(txId);
        
        return txId
    } catch (error) {
        console.error(error);
        return null;
    }

}

// export function decodeOnAlgo(payload: Buffer): { assetId: number, amount: string, receiver: string; } {
    
// }