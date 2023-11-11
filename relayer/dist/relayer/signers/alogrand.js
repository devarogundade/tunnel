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
exports.signTransaction = exports.TUNNEL_ADDR = exports.TUNNEL_ID = void 0;
const algosdk_1 = __importDefault(require("algosdk"));
const algokit = __importStar(require("@algorandfoundation/algokit-utils"));
exports.TUNNEL_ID = 477525147;
exports.TUNNEL_ADDR = 'YUCENRKNQ3OTVIUHXXV7X4INI3JNOLNM4CESQOAICWHKQENVDPD237YRWQ';
// Signing Key
const handlerAlgoKey = process.env.ALGO_PRIVATE_KEY;
const algodClient = algokit.getAlgoClient({
    server: 'https://testnet-api.algonode.cloud'
});
const METHODS = [
    new algosdk_1.default.ABIMethod({ name: "receiveMessage", desc: "", args: [{ type: "uint64", name: "nonce", desc: "" }, { type: "asset", name: "asset", desc: "" }, { type: "uint64", name: "amount", desc: "" }, { type: "address", name: "receiver", desc: "" }], returns: { type: "void", desc: "" } }),
];
function signTransaction(nonce, ASSET_ID, amount, receiver) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const account = algokit.mnemonicAccount(handlerAlgoKey);
            const suggestedParams = yield algodClient.getTransactionParams().do();
            const appCall = algosdk_1.default.makeApplicationNoOpTxnFromObject({
                appIndex: exports.TUNNEL_ID,
                from: account.addr,
                appArgs: [
                    algosdk_1.default.getMethodByName(METHODS, 'receiveMessage').getSelector(),
                    algosdk_1.default.encodeUint64(nonce),
                    algosdk_1.default.encodeUint64(ASSET_ID),
                    algosdk_1.default.encodeUint64(BigInt(amount)),
                    algosdk_1.default.decodeAddress(receiver).publicKey
                ],
                accounts: [receiver],
                foreignAssets: [ASSET_ID],
                suggestedParams: Object.assign(Object.assign({}, suggestedParams), { fee: algokit.algos(0.0015).microAlgos }),
            });
            const signedTxn = algosdk_1.default.signTransaction(appCall, account.sk);
            const { txId } = yield algodClient.sendRawTransaction(signedTxn.blob).do();
            yield algosdk_1.default.waitForConfirmation(algodClient, txId, 3);
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
