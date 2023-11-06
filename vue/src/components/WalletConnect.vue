<template>
    <div class="container">
        <div class="wrapper">
            <div class="header">
                <p>Connect Wallets</p>
                <CloseIcon class="header_close" @click="$emit('close')" />
            </div>

            <div class="wallets">
                <div class="wallet" @click="walletConnect">
                    <img src="/images/wallet-connect.png" alt="">
                    <p>{{ $store.state.wallet0 ? $fineAddress($store.state.wallet0) : 'WalletConnect' }}</p>
                </div>
                <div class="wallet" @click="peraConnect">
                    <img src="/images/pera.png" alt="">
                    <p>{{ $store.state.wallet1 ? $fineAddress($store.state.wallet1) : 'Pera Wallet' }}</p>
                </div>

                <p v-if="aWallet && aWallet != $store.state.wallet1" style="color: red; font-size: 12px; margin-top: 4px;">
                    You are connected to wrong Pera Wallet
                </p>

                <PrimaryButton v-if="!checking && !aWallet" :progress="syncing" @click="sync" style="margin-top: 20px;"
                    :text="'Sync Wallets'" />
            </div>
        </div>
    </div>
</template>

<script setup>
import CloseIcon from '../components/icons/CloseIcon.vue'
import PrimaryButton from '../components/PrimaryButton.vue'
</script>

<script>
import { PeraWalletConnect } from "@perawallet/connect"
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/vue'
import { bscTestnet } from '@wagmi/core/chains'
import { watchAccount } from '@wagmi/core'
import { trySyncWallets, tryGetAlgoWallet } from '../scripts/token'
import { notify } from '../reactives/notify'

const projectId = import.meta.env.VITE_PROJECT_ID

const peraWallet = new PeraWalletConnect({
    chainId: 416002,
});

export default {
    data() {
        return {
            modal: null,
            syncing: false,
            aWallet: null,
            checking: true
        }
    },
    async mounted() {
        this.algoWallet()

        try {
            const accounts = await peraWallet.reconnectSession()
            this.$store.commit('setWallet1', accounts[0])
        } catch (error) { }
    },
    methods: {
        algoWallet: async function () {
            this.checking = true
            if (this.$store.state.wallet0) {
                this.aWallet = await tryGetAlgoWallet(
                    this.$store.state.wallet0
                )
            }
            this.checking = false
        },
        walletConnect: async function () {
            const metadata = {
                name: 'TunnelFi',
                description: 'Connect Your Web3 Wallet',
                url: 'https://web3modal.com',
                icons: ['https://avatars.githubusercontent.com/u/37784886']
            }

            const chains = [bscTestnet]
            const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata })

            if (!this.modal || !this.$store.state.wallet0) {
                this.modal = createWeb3Modal({ wagmiConfig, projectId, chains, defaultChain: bscTestnet })
                this.modal.open()
            } else {
                this.modal.open({ view: 'Account' })
            }

            watchAccount((account) => {
                this.$store.commit('setWallet0', account.address)
            })
        },
        peraConnect: async function () {
            if (this.$store.wallet1) return

            try {
                const accounts = await peraWallet.connect()
                this.$store.commit('setWallet1', accounts[0])
            } catch (error) {
                console.error(error);
            }
        },
        sync: async function () {
            if (!this.$store.state.wallet0 || !this.$store.state.wallet1) {
                notify.push({
                    'title': 'Connect your wallets',
                    'description': 'Please try again!',
                    'category': 'error'
                })
                return
            }

            if (this.syncing) return
            this.syncing = true

            const transaction = await trySyncWallets(
                this.$store.state.wallet1
            )

            if (transaction && transaction.transactionHash) {
                notify.push({
                    'title': 'Transaction sent',
                    'description': 'You have synced your wallets!',
                    'category': 'success',
                    'linkTitle': 'View Trx',
                    'linkUrl': `https://testnet.bscsacn.com/tx/${transaction.transactionHash}`
                })

                this.algoWallet()
            } else {
                notify.push({
                    'title': 'Transaction failed',
                    'description': 'Note: you can only sync once!',
                    'category': 'error'
                })
            }

            this.syncing = false
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
</style>
