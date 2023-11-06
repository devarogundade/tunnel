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
Object.defineProperty(exports, "__esModule", { value: true });
const relayer_engine_1 = require("@wormhole-foundation/relayer-engine");
const wormhole_sdk_1 = require("@certusone/wormhole-sdk");
// import { decodeOnEvm, signTransaction as signTransactionOnEvm } from "./signers/ethereum";
// import { signTransaction as signTransactionOnAlgorand } from "./signers/alogrand";
// import { platform } from "os";
(function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // initialize relayer engine app, pass relevant config options
        const app = new relayer_engine_1.StandardRelayerApp(relayer_engine_1.Environment.TESTNET, {
            name: "TunnelRelayer",
        });
        // add a filter with a callback that will be
        // invoked on finding a VAA that matches the filter
        app.multiple({
            [wormhole_sdk_1.CHAIN_ID_ALGORAND]: "468699439",
            [wormhole_sdk_1.CHAIN_ID_BSC]: "0x83ee2EF8f1c8b4669B94F018F6467A9cC736719B"
        }, (ctx, next) => __awaiter(this, void 0, void 0, function* () {
            const vaa = ctx.vaa;
            const hash = ctx.sourceTxHash;
            console.log('Got VAA', vaa === null || vaa === void 0 ? void 0 : vaa.payload);
            if (!(vaa === null || vaa === void 0 ? void 0 : vaa.payload))
                return;
            // if (vaa?.emitterChain == CHAIN_ID_ALGORAND) {
            // const txId = await signTransactionOnEvm(
            //     vaa.nonce, vaa.payload
            // );
            //     console.log('TxID: ', txId);
            // }
            // if (vaa?.emitterChain == CHAIN_ID_BSC) {
            // const { assetId, amount, receiver } = decodeOnEvm(vaa.payload);
            // const txId = await signTransactionOnAlgorand(
            //     vaa.nonce, assetId, amount, receiver
            // );
            //     console.log('TxID: ', txId);
            // }
        }));
        // add and configure any other middleware ..
        // start app, blocks until unrecoverable error or process is stopped
        yield app.listen();
    });
})();
