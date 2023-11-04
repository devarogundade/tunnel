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
const ethereum_1 = require("./signers/ethereum");
(function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // initialize relayer engine app, pass relevant config options
        const app = new relayer_engine_1.StandardRelayerApp(relayer_engine_1.Environment.TESTNET, {
            name: "TunnelRelayer",
        });
        // add a filter with a callback that will be
        // invoked on finding a VAA that matches the filter
        app.multiple({
            // [CHAIN_ID_ALGORAND]: "",
            [wormhole_sdk_1.CHAIN_ID_BSC]: "0x83ee2EF8f1c8b4669B94F018F6467A9cC736719B"
        }, (ctx, next) => __awaiter(this, void 0, void 0, function* () {
            const vaa = ctx.vaa;
            const hash = ctx.sourceTxHash;
            if (!(vaa === null || vaa === void 0 ? void 0 : vaa.payload))
                return;
            if ((vaa === null || vaa === void 0 ? void 0 : vaa.emitterChain) == wormhole_sdk_1.CHAIN_ID_ALGORAND) {
                yield (0, ethereum_1.signTransaction)(vaa.nonce, vaa.payload);
            }
            if ((vaa === null || vaa === void 0 ? void 0 : vaa.emitterChain) == wormhole_sdk_1.CHAIN_ID_BSC) {
                yield signTransactionOnAlgorand(vaa.nonce, vaa.payload);
            }
        }));
        // add and configure any other middleware ..
        // start app, blocks until unrecoverable error or process is stopped
        yield app.listen();
    });
})();
