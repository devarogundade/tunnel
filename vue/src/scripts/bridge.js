import { writeContract, waitForTransaction, prepareWriteContract } from '@wagmi/core';
import WormholeSharesJson from '../contracts/WormholeShares.json'
import TunnelJson from '../contracts/Tunnel.json'

import algosdk from 'algosdk';
import * as algokit from '@algorandfoundation/algokit-utils';
import { PeraWalletConnect } from "@perawallet/connect"

import { historySet } from './history'

////////////// EVM //////////////

export async function tryBridge(amount) {
    try {
        const config = await prepareWriteContract({
            address: TunnelJson.networks[97].address,
            abi: TunnelJson.abi,
            functionName: 'bridge',
            args: [WormholeSharesJson.networks[97].address, amount],
            value: 0 // wormhole fee is free
        });

        const { hash } = await writeContract(config);

        return await waitForTransaction({ hash: hash });
    } catch (error) {
        console.error(error);
        return null;
    }
}

////////////// ALGORAND //////////////

const TUNNEL_ID = 478376514
const WORMHOLE_ID = 86525623
export const ASSET_ID = 478377261
const TUNNEL_ADDR = 'I3V5SKQY4D74PDB5UFASOQ6VPVBLF25TNLVKQ3JCDB4CKHZW5YPXQTBQ4Q'
const WORMHOLE_ADDR = 'C2SZBD4ZFFDXANBCUTG5GBUEWMQ34JS5LFGDRTEVJBAXDRF6ZWB7Q4KHHM'
const STORAGE_ADDR = 'KIJYDTKU6IWJKJAP7JGQDQERWQEKOH7GHPWU3KPR5I37UICFZ5JOCS46E4'

const algodClient = algokit.getAlgoClient({
    server: 'https://testnet-api.algonode.cloud',
});

const peraWallet = new PeraWalletConnect({
    chainId: 416002,
});


const METHODS = [
    new algosdk.ABIMethod({ name: "set_collateral", desc: "", args: [{ type: "uint64", name: "asset_id", desc: "" }], returns: { type: "void", desc: "" } }),
    new algosdk.ABIMethod({ name: "create_collateral", desc: "", args: [{ type: "string", name: "name", desc: "" }, { type: "string", name: "unit_name", desc: "" }, { type: "uint64", name: "supply", desc: "" }], returns: { type: "void", desc: "" } }),
    new algosdk.ABIMethod({ name: "supply", desc: "", args: [{ type: "pay", name: "payment", desc: "" }], returns: { type: "void", desc: "" } }),
    new algosdk.ABIMethod({ name: "borrow", desc: "", args: [{ type: "asset", name: "asset", desc: "" }, { type: "uint64", name: "amount", desc: "" }], returns: { type: "void", desc: "" } }),
    new algosdk.ABIMethod({ name: "repay", desc: "", args: [{ type: "pay", name: "payment", desc: "" }], returns: { type: "void", desc: "" } }),
    new algosdk.ABIMethod({ name: "withdraw", desc: "", args: [], returns: { type: "void", desc: "" } }),
    new algosdk.ABIMethod({ name: "receiveMessage", desc: "", args: [{ type: "uint64", name: "nonce", desc: "" }, { type: "asset", name: "asset", desc: "" }, { type: "uint64", name: "amount", desc: "" }, { type: "address", name: "receiver", desc: "" }], returns: { type: "void", desc: "" } }),
    new algosdk.ABIMethod({ name: "un_bridge", desc: "", args: [{ type: "asset", name: "asset", desc: "" }, { type: "uint64", name: "amount", desc: "" }, { type: "uint64", name: "wormhole", desc: "" }, { type: "address", name: "wormhole_addr", desc: "" }, { type: "address", name: "storage_addr", desc: "" }], returns: { type: "void", desc: "" } }),
    new algosdk.ABIMethod({ name: "liquidate", desc: "", args: [{ type: "account", name: "borrower", desc: "" }], returns: { type: "void", desc: "" } }),
    new algosdk.ABIMethod({ name: "snipe", desc: "", args: [{ type: "pay", name: "payment", desc: "" }, { type: "uint64", name: "wormhole", desc: "" }, { type: "address", name: "wormhole_addr", desc: "" }, { type: "address", name: "storage_addr", desc: "" }], returns: { type: "void", desc: "" } }),
    new algosdk.ABIMethod({ name: "borrow_of", desc: "", args: [{ type: "address", name: "address", desc: "" }], returns: { type: "(uint64,uint64,uint64)", desc: "" } }),
    new algosdk.ABIMethod({ name: "supply_of", desc: "", args: [{ type: "address", name: "address", desc: "" }], returns: { type: "(uint64,uint64)", desc: "" } })
];

export async function readApp() {
    try {
        return await algodClient.getApplicationByID(TUNNEL_ID).do()
    } catch (error) {
        console.error(error);
        return null
    }
}

export async function readOptIn(account) {
    try {
        return await algodClient.accountApplicationInformation(account, TUNNEL_ID).do()
    } catch (error) {
        console.error(error);
        return null
    }
}

export async function tryOptIn() {
    try {
        const accounts = await peraWallet.reconnectSession()

        const suggestedParams = await algodClient.getTransactionParams().do()

        const optInAsset = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
            assetIndex: ASSET_ID,
            from: accounts[0],
            to: accounts[0],
            amount: 0,
            suggestedParams
        })

        const optInApp = algosdk.makeApplicationOptInTxnFromObject({
            appIndex: TUNNEL_ID,
            from: accounts[0],
            appArgs: [],
            suggestedParams
        })

        algosdk.assignGroupID([optInAsset, optInApp])

        const signedTxn = await peraWallet.signTransaction([[{ txn: optInAsset }, { txn: optInApp }]])

        const { txId } = await algodClient.sendRawTransaction(signedTxn).do()

        await algosdk.waitForConfirmation(algodClient, txId, 3)

        return txId
    } catch (error) {
        console.error(error);
        return null
    }
}


export async function trySupply(amount) {
    try {
        const accounts = await peraWallet.reconnectSession()

        const suggestedParams = await algodClient.getTransactionParams().do();

        const payment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: accounts[0],
            to: TUNNEL_ADDR,
            amount: Number(amount),
            suggestedParams
        })

        const appCall = algosdk.makeApplicationNoOpTxnFromObject({
            appIndex: TUNNEL_ID,
            from: accounts[0],
            foreignApps: [TUNNEL_ID],
            boxes: [{
                appIndex: TUNNEL_ID,
                name: algosdk.decodeAddress(accounts[0]).publicKey
            }],
            appArgs: [
                algosdk.getMethodByName(METHODS, 'supply').getSelector(),
                algosdk.encodeUnsignedTransaction(payment)
            ],
            suggestedParams
        })

        algosdk.assignGroupID([payment, appCall])

        const signedTxn = await peraWallet.signTransaction([[{ txn: payment }, { txn: appCall }]])

        const { txId } = await algodClient.sendRawTransaction(signedTxn).do()

        await algosdk.waitForConfirmation(algodClient, txId, 3)

        historySet(txId, 'supply', amount, 'a'.repeat(64), Date.now())

        return txId
    } catch (error) {
        console.error(error);
        return null
    }
}

export async function tryUnBridge(amount) {
    try {
        const accounts = await peraWallet.reconnectSession()

        const suggestedParams = await algodClient.getTransactionParams().do()

        const appCall = algosdk.makeApplicationCallTxnFromObject({
            appIndex: TUNNEL_ID,
            from: accounts[0],
            appArgs: [
                algosdk.getMethodByName(METHODS, 'un_bridge').getSelector(),
                algosdk.encodeUint64(ASSET_ID),
                algosdk.encodeUint64(BigInt(amount)),
                algosdk.encodeUint64(WORMHOLE_ID),
                algosdk.decodeAddress(WORMHOLE_ADDR).publicKey,
                algosdk.decodeAddress(STORAGE_ADDR).publicKey,
            ],
            accounts: [WORMHOLE_ADDR, STORAGE_ADDR],
            foreignAssets: [ASSET_ID],
            foreignApps: [WORMHOLE_ID],
            suggestedParams: { ...suggestedParams, fee: algokit.algos(0.001).microAlgos }
        })

        const signedTxn = await peraWallet.signTransaction([[{ txn: appCall }]])

        const { txId } = await algodClient.sendRawTransaction(signedTxn).do()

        await algosdk.waitForConfirmation(algodClient, txId, 3)

        return txId
    } catch (error) {
        console.error(error);
        return null
    }
}


export async function tryBorrow(amount) {
    try {
        const accounts = await peraWallet.reconnectSession()

        const suggestedParams = await algodClient.getTransactionParams().do();

        const appCall = algosdk.makeApplicationNoOpTxnFromObject({
            appIndex: TUNNEL_ID,
            from: accounts[0],
            foreignAssets: [ASSET_ID],
            boxes: [{
                appIndex: TUNNEL_ID,
                name: algosdk.decodeAddress(accounts[0]).publicKey
            }],
            appArgs: [
                algosdk.getMethodByName(METHODS, 'borrow').getSelector(),
                algosdk.encodeUint64(ASSET_ID),
                algosdk.encodeUint64(BigInt(amount)),
            ],
            suggestedParams: { ...suggestedParams, fee: algokit.algos(0.0015).microAlgos },
        })

        const signedTxn = await peraWallet.signTransaction([[{ txn: appCall }]])

        const { txId } = await algodClient.sendRawTransaction(signedTxn).do()

        await algosdk.waitForConfirmation(algodClient, txId, 3)

        historySet(txId, 'borrow', amount, ASSET_ID, Date.now())

        return txId
    } catch (error) {
        console.error(error);
        return null
    }
}


export async function tryRepay(amount) {
    try {
        const accounts = await peraWallet.reconnectSession()

        const suggestedParams = await algodClient.getTransactionParams().do();

        const payment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: accounts[0],
            to: TUNNEL_ADDR,
            amount: BigInt(amount.toFixed(0)),
            suggestedParams
        })

        const appCall = algosdk.makeApplicationNoOpTxnFromObject({
            appIndex: TUNNEL_ID,
            from: accounts[0],
            foreignApps: [TUNNEL_ID],
            foreignAssets: [ASSET_ID],
            boxes: [{
                appIndex: TUNNEL_ID,
                name: algosdk.decodeAddress(accounts[0]).publicKey
            }],
            appArgs: [
                algosdk.getMethodByName(METHODS, 'repay').getSelector(),
                algosdk.encodeUnsignedTransaction(payment)
            ],
            suggestedParams: { ...suggestedParams, fee: algokit.algos(0.001).microAlgos }
        })

        algosdk.assignGroupID([payment, appCall])

        const signedTxn = await peraWallet.signTransaction([[{ txn: payment }, { txn: appCall }]])

        const { txId } = await algodClient.sendRawTransaction(signedTxn).do()

        await algosdk.waitForConfirmation(algodClient, txId, 3)

        historySet(txId, 'repay', amount, 'a'.repeat(64), Date.now())

        return txId
    } catch (error) {
        console.error(error);
        return null
    }
}

export async function tryWithdraw(estimate) {
    try {
        const accounts = await peraWallet.reconnectSession()

        const suggestedParams = await algodClient.getTransactionParams().do();

        const appCall = algosdk.makeApplicationNoOpTxnFromObject({
            appIndex: TUNNEL_ID,
            from: accounts[0],
            foreignApps: [TUNNEL_ID],
            boxes: [{
                appIndex: TUNNEL_ID,
                name: algosdk.decodeAddress(accounts[0]).publicKey
            }],
            appArgs: [
                algosdk.getMethodByName(METHODS, 'withdraw').getSelector()
            ],
            suggestedParams: { ...suggestedParams, fee: algokit.algos(0.001).microAlgos }
        })

        const signedTxn = await peraWallet.signTransaction([[{ txn: appCall }]])

        const { txId } = await algodClient.sendRawTransaction(signedTxn).do()

        await algosdk.waitForConfirmation(algodClient, txId, 3)

        historySet(txId, 'withdraw', estimate, 'a'.repeat(64), Date.now())

        return txId
    } catch (error) {
        console.error(error);
        return null
    }
}

export async function trySnipe(amount) {
    try {
        const accounts = await peraWallet.reconnectSession()

        const suggestedParams = await algodClient.getTransactionParams().do();

        const payment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: accounts[0],
            to: TUNNEL_ADDR,
            amount: BigInt(amount),
            suggestedParams
        })

        const appCall = algosdk.makeApplicationNoOpTxnFromObject({
            appIndex: TUNNEL_ID,
            from: accounts[0],
            foreignApps: [WORMHOLE_ID],
            appArgs: [
                algosdk.getMethodByName(METHODS, 'snipe').getSelector(),
                algosdk.encodeUnsignedTransaction(payment),
                algosdk.encodeUint64(WORMHOLE_ID),
                algosdk.decodeAddress(WORMHOLE_ADDR).publicKey,
                algosdk.decodeAddress(STORAGE_ADDR).publicKey
            ],
            boxes: [{
                appIndex: TUNNEL_ID,
                name: algosdk.decodeAddress(accounts[0]).publicKey
            }],
            accounts: [WORMHOLE_ADDR, STORAGE_ADDR],
            suggestedParams: { ...suggestedParams, fee: algokit.algos(0.001).microAlgos }
        })

        algosdk.assignGroupID([payment, appCall])

        const signedTxn = await peraWallet.signTransaction([[{ txn: payment }, { txn: appCall }]])

        const { txId } = await algodClient.sendRawTransaction(signedTxn).do()

        await algosdk.waitForConfirmation(algodClient, txId, 3)

        historySet(txId, 'snipe', estimate, 'a'.repeat(64), Date.now())

        return txId
    } catch (error) {
        console.error(error);
        return null
    }
}