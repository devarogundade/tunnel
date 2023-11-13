import * as dotenv from "dotenv";
dotenv.config();

import http from 'http';

import {
    Environment,
    StandardRelayerApp,
    StandardRelayerContext,
} from "@wormhole-foundation/relayer-engine";
import { CHAIN_ID_ALGORAND, CHAIN_ID_BSC } from "@certusone/wormhole-sdk";
import { TUNNEL_ID, decodeOnAlgo } from "./signers/alogrand";
import { TUNNEL_ADDRESS } from "./signers/ethereum";
import { decodeOnEvm, signTransaction as signTransactionOnEvm } from "./signers/ethereum";
import { signTransaction as signTransactionOnAlgorand } from "./signers/alogrand";

(function server(): void {
    // use hostname 127.0.0.1 unless there exists a preconfigured port
    const hostname = process.env.HOST || '127.0.0.1';
    // use port 3000 unless there exists a preconfigured port
    const port = process.env.PORT || 5050;
    http.createServer(function (request, response) {
        const headers = {
            'Access-Control-Allow-Origin': '*', /* @dev First, read about security */
            'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
            'Access-Control-Max-Age': 2592000, // 30 days
            'Content-Type': 'application/json'
        };

        if (request.method === 'OPTIONS') {
            response.writeHead(204, headers);
            response.end();
            return;
        }

        if (['GET', 'POST'].indexOf(request.method!!) > -1) {
            response.writeHead(200, headers);
            response.end(JSON.stringify({ 'status': 'good' }), 'utf-8');
            return;
        }

        response.writeHead(405, headers);
        response.end(`${request.method} is not allowed for the request.`);
    }).listen(port);

    console.log(`⚡ Server running at http://${hostname}:${port}/`);
})();

(async function main() {
    // initialize relayer engine app, pass relevant config options
    const app = new StandardRelayerApp<StandardRelayerContext>(
        Environment.TESTNET,
        {
            name: "TunnelRelayer",
            missedVaaOptions: {
                startingSequenceConfig: {
                    "4": BigInt(0),
                    "8": BigInt(1)
                }
            }
        },
    );

    // add a filter with a callback that will be
    // invoked on finding a VAA that matches the filter

    app.multiple(
        {
            [CHAIN_ID_ALGORAND]: `${TUNNEL_ID}`,
            [CHAIN_ID_BSC]: `${TUNNEL_ADDRESS}`
        },
        async (ctx, next) => {
            const vaa = ctx.vaa;
            const hash = ctx.sourceTxHash;

            if (!vaa?.payload) return;

            console.log(`⚡ Got VAA: from chain id ${vaa?.emitterChain}`, vaa?.payload.toString('hex'));

            if (vaa?.emitterChain == CHAIN_ID_ALGORAND) {
                const { assetId, amount, receiver } = decodeOnAlgo(vaa?.payload.toString('hex'));
                const txId = await signTransactionOnEvm(
                    vaa.nonce, assetId, amount, receiver
                );

                console.log('⚡From TxID: ', hash);
                console.log('⚡To TxID: ', txId);
            } else if (vaa?.emitterChain == CHAIN_ID_BSC) {
                const { assetId, amount, receiver } = decodeOnEvm(vaa?.payload.toString('hex'));

                const txId = await signTransactionOnAlgorand(
                    vaa.nonce, assetId, amount, receiver
                );

                console.log('⚡From TxID: ', hash);
                console.log('⚡To TxID: ', txId);
            }
        },
    );

    // add and configure any other middleware ..
    // start app, blocks until unrecoverable error or process is stopped
    await app.listen();
})();