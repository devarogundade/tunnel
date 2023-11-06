<template>
    <div class="container">
        <div class="wrapper">
            <div class="header">
                <p>Free Wormhole Shares</p>
                <CloseIcon class="header_close" @click="$emit('close')" />
            </div>

            <div class="wallets">
                <div class="wallet">
                    <img src="/images/wormhole.png" alt="">
                    <p>10 WSHARES</p>
                </div>

                <PrimaryButton @click="faucet" style="margin-top: 20px;" :text="'Mint'" :progress="minting" />
                <button @click="allow" class="allow">
                    <p>{{ allowing ? 'Talking to managers..' : 'Allow Me' }}</p>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import CloseIcon from '../components/icons/CloseIcon.vue'
import PrimaryButton from '../components/PrimaryButton.vue'
</script>

<script>
import { tryFaucet, tryAllow } from '../scripts/token'
import { notify } from '../reactives/notify'

export default {
    data() {
        return {
            minting: false,
            allowing: false,
        }
    },
    methods: {
        allow: async function () {
            if (this.allowing) return
            this.allowing = true

            const transaction = await tryAllow()

            if (transaction && transaction.transactionHash) {
                notify.push({
                    'title': 'Transaction sent',
                    'description': 'You are allowed to mint Wormhole Shares!',
                    'category': 'success',
                    'linkTitle': 'View Trx',
                    'linkUrl': `https://testnet.bscsacn.com/tx/${transaction.transactionHash}`
                })
            } else {
                notify.push({
                    'title': 'Transaction failed',
                    'description': 'Please try again!',
                    'category': 'error'
                })
            }

            this.allowing = false
        },
        faucet: async function () {
            if (this.minting) return
            this.minting = true

            const transaction = await tryFaucet()

            if (transaction && transaction.transactionHash) {
                notify.push({
                    'title': 'Transaction sent',
                    'description': '10 Wormhole Shares uccessfully minted!',
                    'category': 'success',
                    'linkTitle': 'View Trx',
                    'linkUrl': `https://testnet.bscsacn.com/tx/${transaction.transactionHash}`
                })
            } else {
                notify.push({
                    'title': 'Transaction failed',
                    'description': 'Please try again!',
                    'category': 'error'
                })
            }

            this.minting = false
        }
    }
}
</script>

<style scoped>
.container {
    display: flex;
    gap: 40px;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    background-color: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(4px);
}

.wrapper {
    width: 330px;
    border-radius: 8px;
    border: 2px solid var(--bg-lighter);
    background: var(--bg-light);
}


.wrapper svg {
    cursor: pointer;
}

.header {
    padding: 20px 20px 10px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}


.header_close {
    background: var(--bg-lightest);
    height: 30px;
    width: 30px;
    border-radius: 4px;
    padding: 4px;
}

.header p {
    font-size: 16px;
    font-weight: 600;
    color: white;
}

.wallets {
    padding: 0 20px 20px 20px;
}

.wallet {
    height: 60px;
    border-radius: 4px;
    background: var(--bg-lightest);
    margin-top: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 0 16px;
    cursor: pointer;
    user-select: none;
}

.wallet img {
    width: 24px;
    height: 24px;
    border-radius: 12px;
}

.wallet p {
    color: gray;
    font-size: 16px;
}

.allow {
    width: 100%;
    text-align: center;
    height: 40px;
    font-size: 14px;
    text-decoration: underline;
    color: white;
    cursor: pointer;
    border: none;
    border-radius: 6px;
}
</style>
