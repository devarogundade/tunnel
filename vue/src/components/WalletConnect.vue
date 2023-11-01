<template>
    <div class="container">
        <div class="wrapper">
            <div class="header">
                <p>Connect Wallets</p>
                <CloseIcon class="header_close" @click="$emit('close')" />
            </div>

            <div class="wallets">
                <div class="wallet" @click="walletConnect">
                    <img src="../public/images/wallet-connect.png" alt="">
                    <p>{{ $store.state.wallet0 ? $fineAddress($store.state.wallet0) : 'WalletConnect' }}</p>
                </div>

                <div class="wallet" @click="peraConnect">
                    <img src="../public/images/pera.png" alt="">
                    <p>{{ $store.state.wallet1 ? $fineAddress($store.state.wallet1) : 'Pera Wallet' }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import CloseIcon from '../components/icons/CloseIcon.vue'
</script>

<script>
import { PeraWalletConnect } from "@perawallet/connect"
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/vue'
import { bscTestnet } from '@wagmi/core/chains'
import { watchAccount } from '@wagmi/core'

const projectId = import.meta.env.VITE_PROJECT_ID

export default {
    data() {
        return {
            modal: null
        }
    },
    methods: {
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

            const peraWallet = new PeraWalletConnect({
                chainId: this.$algorandTestnet().id,
            });

            try {
                const accounts = await peraWallet.connect()
                this.$store.commit('setWallet1', accounts[0])
            } catch (error) {
                console.error(error);
            }
        }
    }
}
</script>

<style scoped>
.container {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    backdrop-filter: blur(4px);
    padding-bottom: 15%;
}

.wrapper {
    width: 330px;
    border-radius: 8px;
    border: 2px solid var(--bg-lighter);
    background: var(--bg-light);
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
