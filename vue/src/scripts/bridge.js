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

const methods = [
    new algosdk.ABIMethod({ name: "opt_in_asset", desc: "", args: [{ type: "asset", name: "asset", desc: "" }], returns: { type: "void", desc: "" } }),
    new algosdk.ABIMethod({ name: "set_collateral", desc: "", args: [{ type: "byte", name: "name", desc: "" }, { type: "byte", name: "symbol", desc: "" }, { type: "uint64", name: "supply", desc: "" }], returns: { type: "void", desc: "" } }),
    new algosdk.ABIMethod({ name: "supply", desc: "", args: [{ type: "pay", name: "payment", desc: "" }], returns: { type: "void", desc: "" } }),
    new algosdk.ABIMethod({ name: "borrow", desc: "", args: [{ type: "asset", name: "asset", desc: "" }], returns: { type: "void", desc: "" } }),
    new algosdk.ABIMethod({ name: "repay", desc: "", args: [{ type: "pay", name: "payment", desc: "" }], returns: { type: "void", desc: "" } }),
    new algosdk.ABIMethod({ name: "withdraw", desc: "", args: [], returns: { type: "void", desc: "" } }),
    new algosdk.ABIMethod({ name: "un_bridge", desc: "", args: [{ type: "asset", name: "asset", desc: "" }, { type: "application", name: "wormhole", desc: "" }, { type: "account", name: "wormhole_account", desc: "" }, { type: "account", name: "storage_account", desc: "" }], returns: { type: "void", desc: "" } }),
    new algosdk.ABIMethod({ name: "borrow_of", desc: "", args: [{ type: "address", name: "address", desc: "" }], returns: { type: "(uint64,uint64,uint64)", desc: "" } }),
    new algosdk.ABIMethod({ name: "supply_of", desc: "", args: [{ type: "address", name: "address", desc: "" }], returns: { type: "(uint64,uint64)", desc: "" } })
];

export async function trySupply(amount, account) {
    try {
        const suggestedParams = await algodClient.getTransactionParams().do();

        const payment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: account,
            to: tunnelAcct,
            amount: Number(amount),
            suggestedParams
        })

        const appCall = algosdk.makeApplicationNoOpTxnFromObject({
            appIndex: tunnelId,
            from: account,
            foreignApps: [tunnelId],
            boxes: [{
                appIndex: tunnelId,
                name: algosdk.decodeAddress(account).publicKey
            }],
            appArgs: [
                algosdk.getMethodByName(methods, 'supply').getSelector(),
                algosdk.encodeUnsignedTransaction(payment)
            ],
            suggestedParams
        })

        algosdk.assignGroupID([payment, appCall])

        const signedTxn = await peraWallet.signTransaction([[{ txn: payment }, { txn: appCall }]])

        const { txId } = await algodClient.sendRawTransaction(signedTxn).do()

        await algodClient.waitForTransaction()

        return txId
    } catch (error) {
        console.error(error);
        return null
    }
}

export async function tryUnBridge(account) {
    try {
        const suggestedParams = await algodClient.getTransactionParams().do();

        const appCall = algosdk.makeApplicationCallTxnFromObject({
            appIndex: tunnelId,
            appArgs: [
                algosdk.getMethodByName(methods, 'un_bridge').getSelector(),
                algosdk.encodeUint64(assetId),
                algosdk.encodeUint64(wormholeId),
                algosdk.decodeAddress(wormholeAcct).publicKey,
                algosdk.decodeAddress(storageAcct).publicKey
            ],
            boxes: [{
                appIndex: tunnelId,
                name: algosdk.decodeAddress(account).publicKey
            }],
            from: address,
            foreignAssets: [assetId],
            foreignApps: [tunnelId, wormholeId],
            suggestedParams: { ...suggestedParams, fee: algokit.algos(0.0015).microAlgos },
        })

        const signedTxn = await peraWallet.signTransaction([[{ appCall }]], address)

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

export async function tryWithdraw(account) {
    try {
        const suggestedParams = await algodClient.getTransactionParams().do();

        const appCall = algosdk.makeApplicationNoOpTxnFromObject({
            appIndex: tunnelId,
            from: account,
            foreignApps: [tunnelId],
            boxes: [{
                appIndex: tunnelId,
                name: algosdk.decodeAddress(account).publicKey
            }],
            appArgs: [
                algosdk.getMethodByName(methods, 'withdraw').getSelector()
            ],
            suggestedParams: { ...suggestedParams, fee: algokit.algos(0.0015).microAlgos }
        })

        const signedTxn = await peraWallet.signTransaction([[{ txn: appCall }]])

        const { txId } = await algodClient.sendRawTransaction(signedTxn).do()

        return txId
    } catch (error) {
        console.error(error);
        return null
    }
}