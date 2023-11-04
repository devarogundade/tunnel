import {
    Environment,
    StandardRelayerApp,
    StandardRelayerContext,
} from "@wormhole-foundation/relayer-engine";
import { CHAIN_ID_ALGORAND, CHAIN_ID_BSC } from "@certusone/wormhole-sdk";
import { decodeOnEvm, signTransaction as signTransactionOnEvm } from "./signers/ethereum";
import { signTransaction as signTransactionOnAlgorand } from "./signers/alogrand";
import { platform } from "os";

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
            // [CHAIN_ID_ALGORAND]: "",
            [CHAIN_ID_BSC]: "0x83ee2EF8f1c8b4669B94F018F6467A9cC736719B"
        },
        async (ctx, next) => {
            const vaa = ctx.vaa;
            const hash = ctx.sourceTxHash;

            if (!vaa?.payload) return;

            if (vaa?.emitterChain == CHAIN_ID_ALGORAND) {
                const txId = await signTransactionOnEvm(
                    vaa.nonce, vaa.payload
                );

                console.log('TxID: ', txId);
            }

            if (vaa?.emitterChain == CHAIN_ID_BSC) {
                const { assetId, amount, receiver } = decodeOnEvm(vaa.payload);

                const txId = await signTransactionOnAlgorand(
                    vaa.nonce, assetId, amount, receiver
                );

                console.log('TxID: ', txId);
            }

        },
    );

    // add and configure any other middleware ..

    // start app, blocks until unrecoverable error or process is stopped
    await app.listen();
})();