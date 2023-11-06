"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signTransaction = void 0;
const algosdk_1 = __importDefault(require("algosdk"));
const algokit = __importStar(require("@algorandfoundation/algokit-utils"));
const application_json_1 = __importDefault(require("../../algorand/smart_contracts/artifacts/TunnelFi/application.json"));
const tunnelId = 1;
const tunnel = new algosdk_1.default.ABIContract(application_json_1.default.contract);
// Signing Key and Address
const handlerAlgoKey = process.env.ALGO_PRIVATE_KEY;
const handlerAlgoAddress = process.env.ALGO_PUBLIC_KEY;
const algodClient = algokit.getAlgoClient({
    server: 'https://testnet-api.algonode.cloud'
});
function signTransaction(nonce, assetId, ammout, receiver) {
    return __awaiter(this, void 0, void 0, function* () {
        const account = algokit.mnemonicAccount(handlerAlgoKey);
        const suggestedParams = yield algodClient.getTransactionParams().do();
        const fee = suggestedParams.fee * 3;
        const args = [new Uint8Array()];
        const txn = algosdk_1.default.makeApplicationCallTxnFromObject({
            appIndex: 0,
            appArgs: args,
            from: handlerAlgoAddress,
            foreignAssets: [],
            suggestedParams: Object.assign(Object.assign({}, suggestedParams), { fee: fee, flatFee: true }),
            onComplete: algosdk_1.default.OnApplicationComplete.NoOpOC
        });
        try {
            const signedTxn = txn.signTxn(account.sk);
            const { txId } = yield algodClient.sendRawTransaction(signedTxn).do();
            console.log(txId);
            return txId;
        }
        catch (error) {
            console.error(error);
            return null;
        }
    });
}
exports.signTransaction = signTransaction;
// export function decodeOnAlgo(payload: Buffer): { assetId: number, amount: string, receiver: string; } {
// }
