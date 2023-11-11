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
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const http_1 = __importDefault(require("http"));
const relayer_engine_1 = require("@wormhole-foundation/relayer-engine");
const wormhole_sdk_1 = require("@certusone/wormhole-sdk");
const alogrand_1 = require("./signers/alogrand");
const ethereum_1 = require("./signers/ethereum");
const ethereum_2 = require("./signers/ethereum");
const alogrand_2 = require("./signers/alogrand");
(function server() {
    // use hostname 127.0.0.1 unless there exists a preconfigured port
    const hostname = process.env.HOST || '127.0.0.1';
    // use port 3000 unless there exists a preconfigured port
    const port = process.env.PORT || 5050;
    http_1.default.createServer(function (request, response) {
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
            'Access-Control-Max-Age': 2592000,
            'Content-Type': 'application/json'
        };
        if (request.method === 'OPTIONS') {
            response.writeHead(204, headers);
            response.end();
            return;
        }
        if (['GET', 'POST'].indexOf(request.method) > -1) {
            response.writeHead(200, headers);
            response.end(JSON.stringify({ 'status': 'good' }), 'utf-8');
            return;
        }
        response.writeHead(405, headers);
        response.end(`${request.method} is not allowed for the request.`);
    }).listen(port);
    console.log(`⚡ Server running at http://${hostname}:${port}/`);
})();
(function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // initialize relayer engine app, pass relevant config options
        const app = new relayer_engine_1.StandardRelayerApp(relayer_engine_1.Environment.TESTNET, {
            name: "TunnelRelayer",
            missedVaaOptions: {
                startingSequenceConfig: {
                    "8": BigInt(1)
                }
            }
        });
        // add a filter with a callback that will be
        // invoked on finding a VAA that matches the filter
        app.multiple({
            [wormhole_sdk_1.CHAIN_ID_ALGORAND]: `${alogrand_1.TUNNEL_ID}`,
            [wormhole_sdk_1.CHAIN_ID_BSC]: `${ethereum_1.TUNNEL_ADDRESS}`
        }, (ctx, next) => __awaiter(this, void 0, void 0, function* () {
            const vaa = ctx.vaa;
            const hash = ctx.sourceTxHash;
            // if (!vaa?.payload) return;
            console.log(`⚡ Got VAA: from ${vaa === null || vaa === void 0 ? void 0 : vaa.emitterChain}`, vaa === null || vaa === void 0 ? void 0 : vaa.payload.toString('hex'));
            // if (vaa?.emitterChain == CHAIN_ID_ALGORAND) {
            //     const txId = await signTransactionOnEvm(
            //         vaa.nonce, vaa.payload
            //     );
            //     console.log('⚡TxID: ', txId);
            // }
            if ((vaa === null || vaa === void 0 ? void 0 : vaa.emitterChain) == wormhole_sdk_1.CHAIN_ID_BSC) {
                const { assetId, amount, receiver } = (0, ethereum_2.decodeOnEvm)(vaa === null || vaa === void 0 ? void 0 : vaa.payload.toString('hex'));
                const txId = yield (0, alogrand_2.signTransaction)(vaa.nonce, assetId, amount, receiver);
                console.log('⚡From TxID: ', hash);
                console.log('⚡To TxID: ', txId);
            }
        }));
        // add and configure any other middleware ..
        // start app, blocks until unrecoverable error or process is stopped
        yield app.listen();
    });
})();
