import * as dotenv from "dotenv";
dotenv.config();

import {
    Environment,
    StandardRelayerApp,
    StandardRelayerContext,
} from "@wormhole-foundation/relayer-engine";
import { CHAIN_ID_ALGORAND, CHAIN_ID_BSC, parseVaa } from "@certusone/wormhole-sdk";
import { TunnelId } from "./signers/alogrand";
import { tunnelAddr } from "./signers/ethereum";
import { decodeOnEvm, signTransaction as signTransactionOnEvm } from "./signers/ethereum";
import { signTransaction as signTransactionOnAlgorand } from "./signers/alogrand";

(async function main() {
    // initialize relayer engine app, pass relevant config options
    const app = new StandardRelayerApp<StandardRelayerContext>(
        Environment.TESTNET,
        {
            name: "TunnelRelayer",
        },
    );

    // add a filter with a callback that will be
    // invoked on finding a VAA that matches the filter

    app.multiple(
        {
            [CHAIN_ID_ALGORAND]: `${TunnelId}`,
            [CHAIN_ID_BSC]: `${tunnelAddr}`
        },
        async (ctx, next) => {
            const vaa = ctx.vaa;
            const hash = ctx.sourceTxHash;

            console.log('⚡ Got VAA', vaa?.payload.toString('hex'));


            // if (!vaa?.payload) return;

            // if (vaa?.emitterChain == CHAIN_ID_ALGORAND) {
            //     const txId = await signTransactionOnEvm(
            //         vaa.nonce, vaa.payload
            //     );

            //     console.log('TxID: ', txId);
            // }

            if (vaa?.emitterChain == CHAIN_ID_BSC) {
                const { assetId, amount, receiver } = decodeOnEvm(vaa?.payload.toString('hex'));

                console.log(assetId, amount, receiver);

                const txId = await signTransactionOnAlgorand(
                    vaa.nonce, 468701001, amount, receiver
                );

                console.log('TxID: ', txId);
            }
        },
    );

    // add and configure any other middleware ..

    // start app, blocks until unrecoverable error or process is stopped
    await app.listen();
})();