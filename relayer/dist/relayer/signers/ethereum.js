"use strict";
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
const web3_1 = __importDefault(require("web3"));
const Tunnel_json_1 = __importDefault(require("../../solidity/build/contracts/Tunnel.json"));
// Signing Key and Address
const handlerEvmKey = process.env.EVM_PRIVATE_KEY;
const handlerEvmAddress = process.env.EVM_PUBLIC_KEY;
function signTransaction(nonce, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const web3 = new web3_1.default('bsc rpc here');
        const tunnel = new web3.eth.Contract(Tunnel_json_1.default.abi, "0x83ee2EF8f1c8b4669B94F018F6467A9cC736719B");
        const signer = web3.eth.accounts.privateKeyToAccount(handlerEvmKey);
        web3.eth.accounts.wallet.add(signer);
        try {
            const gas = yield tunnel.methods.receiveMessage(nonce, payload).estimateGas({ from: handlerEvmAddress });
            console.log('Gas: ', gas);
            const gasPrice = yield web3.eth.getGasPrice();
            console.log('Gas Price: ', gasPrice);
            const { transactionHash } = yield tunnel.methods.receiveMessage(nonce, payload).send({
                from: handlerEvmAddress,
                gasPrice: gasPrice.toString(),
                gas: gas.toString()
            });
            return transactionHash;
        }
        catch (error) {
            console.error('Transaction: ', error);
            return null;
        }
    });
}
exports.signTransaction = signTransaction;
