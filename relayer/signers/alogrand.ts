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
    const signer = algosdk.makeBasicAccountTransactionSigner(account);

    const atc = new algosdk.AtomicTransactionComposer();
    const suggestedParams = await algodClient.getTransactionParams().do();

    console.log('Account: ', account);
    console.log('suggestedParams: ', suggestedParams);

    atc.addMethodCall({
        method: tunnel.getMethodByName('receiveMessage'),
        methodArgs: [nonce, assetId, receiver],
        suggestedParams: { ...suggestedParams, fee: 3_000, flatFee: true },
        sender: handlerAlgoAddress,
        signer: signer,
        appID: tunnelId
    });

    try {
        const { txIDs } = await atc.execute(algodClient, 3);
        console.log('txIDs: ', txIDs);
        return txIDs[0];
    } catch (error) {
        console.error(error);
        return null;
    }

}

// export function decodeOnAlgo(payload: Buffer): { assetId: number, amount: string, receiver: string; } {
    
// }