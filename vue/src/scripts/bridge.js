import { writeContract, waitForTransaction, prepareWriteContract } from '@wagmi/core';
import WormholeSharesJson from '../contracts/WormholeShares.json'
import TunnelJson from '../contracts/Tunnel.json'

import algosdk from 'algosdk';
import * as algokit from '@algorandfoundation/algokit-utils';
import { PeraWalletConnect } from "@perawallet/connect"

////////////// EVM //////////////

export async function tryBridge(amount) {
    try {
        const config = await prepareWriteContract({
            address: TunnelJson.networks[97].address,
            abi: TunnelJson.abi,
            functionName: 'bridge',
            args: [WormholeSharesJson.networks[97].address, amount],
            value: 0
        });

        const { hash } = await writeContract(config);

        return await waitForTransaction({ hash: hash });
    } catch (error) {
        console.error(error);
        return null;
    }
}

////////////// ALGORAND //////////////

const assetId = 468701001
const tunnelId = 468699439
const wormholeId = 86525623
const tunnelAcct = 'MYW7T3Q6RJAMMQBEDDZNPDLNCJITEJ22KTMKD4NNW363BZN374TCCE6G3Q'
const wormholeAcct = 'C2SZBD4ZFFDXANBCUTG5GBUEWMQ34JS5LFGDRTEVJBAXDRF6ZWB7Q4KHHM'
const storageAcct = 'PBWLEPGMMT6JFNWSVCIE5SJH5YAVNVY3AWOFABQDH4XQWA3RCNVKK3TXYY'

const algodClient = algokit.getAlgoClient({
    server: 'https://testnet-api.algonode.cloud',
    token: '',
    port: ''
});

const peraWallet = new PeraWalletConnect({
    chainId: 416002,
});

const account = algokit.mnemonicAccount("skin embody only fit fine fit identify refuse bench enroll dentist million axis luxury train liquid kitten stumble layer fall airport deliver laugh ability ill")

export async function trySupply(amount) {
    try {
        // const accounts = await peraWallet.reconnectSession()


        // if (accounts.length == 0) return null

        console.log(account);

        const suggestedParams = await algodClient.getTransactionParams().do();

        const payment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: account.addr,
            to: tunnelAcct,
            amount,
            suggestedParams
        })

        const appCall = algosdk.makeApplicationNoOpTxnFromObject({
            appIndex: tunnelId,
            from: account.addr,
            foreignApps: [tunnelId],
            boxes: [{ appIndex: tunnelId, name: algosdk.decodeAddress(account.addr).publicKey }],
            appArgs: [algosdk.encodeObj('supply')],
            suggestedParams
        })

        algosdk.assignGroupID([payment, appCall])

        console.log(payment, appCall);

        const signedTxn1 = algosdk.signTransaction(payment, account.sk)
        const signedTxn2 = algosdk.signTransaction(appCall, account.sk)

        const { txId } = await algodClient.sendRawTransaction(
            [signedTxn1.blob, signedTxn2.blob]
        ).do()

        console.log(txId);
    } catch (error) {
        console.error(error);
        return null
    }
}

export async function tryUnBridge(address) {
    try {
        const suggestedParams = await algodClient.getTransactionParams().do();

        const txn = algosdk.makeApplicationCallTxnFromObject({
            appIndex: tunnelId,
            appArgs: [
                new Uint8Array(Buffer.from('un_bridge')),
                new Uint8Array(Buffer.from(tunnelId.toString())),
                new Uint8Array(Buffer.from(wormholeId.toString())),
                new Uint8Array(Buffer.from(wormholeAcct)),
                new Uint8Array(Buffer.from(storageAcct))
            ],
            boxes: [
                {
                    appIndex: Number(tunnelId),
                    name: new Uint8Array(Buffer.from(address))
                }
            ],
            from: address,
            foreignAssets: [assetId],
            foreignApps: [wormholeId],
            suggestedParams: { ...suggestedParams, fee: 3_000, flatFee: true },
            onComplete: algosdk.OnApplicationComplete.NoOpOC
        })

        const signedTxn = await peraWallet.signTransaction([[{ txn }]], address)

        const { txId } = await algodClient.sendRawTransaction(signedTxn).do()

        return txId
    } catch (error) {
        console.error(error);
        return null
    }
}

export async function tryBorrow(amount) {

}


export async function tryRepay(amount) {

}