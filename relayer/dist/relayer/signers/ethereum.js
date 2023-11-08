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
exports.decodeOnEvm = exports.signTransaction = exports.TUNNEL_ADDRESS = void 0;
const web3_1 = require("web3");
const Tunnel_json_1 = __importDefault(require("../../solidity/build/contracts/Tunnel.json"));
// Signing Key and Address
const handlerEvmKey = process.env.EVM_PRIVATE_KEY;
const web3 = new web3_1.Web3('https://bsc-testnet.public.blastapi.io');
exports.TUNNEL_ADDRESS = Tunnel_json_1.default.networks[97].address;
function signTransaction(nonce, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const tunnel = new web3_1.Contract(Tunnel_json_1.default.abi, exports.TUNNEL_ADDRESS, web3);
        const signer = web3.eth.accounts.privateKeyToAccount(handlerEvmKey);
        web3.eth.accounts.wallet.add(signer);
        try {
            const gas = yield tunnel.methods.receiveMessage(nonce, payload).estimateGas({ from: signer.address });
            console.log('Gas: ', gas);
            const gasPrice = yield web3.eth.getGasPrice();
            console.log('Gas Price: ', gasPrice);
            const { transactionHash } = yield tunnel.methods.receiveMessage(nonce, payload).send({
                from: signer.address,
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
function decodeOnEvm(payload) {
    const data = web3.eth.abi.decodeParameters(['uint256', 'uint256', 'string'], payload);
    return { assetId: Number(data[0]), amount: String(data[1]), receiver: String(data[2]) };
}
exports.decodeOnEvm = decodeOnEvm;
