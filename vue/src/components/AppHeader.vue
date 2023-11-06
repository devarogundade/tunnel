<template>
    <section>
        <div class="app_width">
            <header>
                <TunnelLogo />

                <div class="tabs">
                    <RouterLink to="/">
                        <button :class="$route.name == 'bridge' ? 'tab tab_active' : 'tab'">
                            <p>Bridge</p>
                        </button>
                    </RouterLink>
                    <RouterLink to="/borrow">
                        <button :class="$route.name == 'borrow' ? 'tab tab_active' : 'tab'">
                            <p>Borrow</p>
                        </button>
                    </RouterLink>
                    <RouterLink to="/supply">
                        <button :class="$route.name == 'supply' ? 'tab tab_active' : 'tab'">
                            <p>Supply</p>
                        </button>
                    </RouterLink>
                </div>


                <div style="display: flex; align-items: center; gap: 20px;">
                    <button @click="connection = true" class="connect_wallets">
                        <p>Connect Wallets</p>
                    </button>
                    <button @click="faucet = true" class="faucet_connect">
                        <p>Faucet</p>
                    </button>
                </div>
            </header>
        </div>

        <FaucetConnect @close="faucet = false" v-if="faucet" />
        <WalletConnect @close="connection = false" v-if="connection" />
    </section>
</template>

<script setup>
import TunnelLogo from '../components/icons/TunnelLogo.vue'
import FaucetConnect from '../components/FaucetConnect.vue'
import WalletConnect from '../components/WalletConnect.vue'
</script>

<script>
import { PeraWalletConnect } from "@perawallet/connect"
import { defaultWagmiConfig } from '@web3modal/wagmi/vue'
import { bscTestnet } from '@wagmi/core/chains'
import { watchAccount } from '@wagmi/core'

const projectId = import.meta.env.VITE_PROJECT_ID

export default {
    data() {
        return {
            faucet: false,
            connection: false,
        }
    },
    mounted() {
        const metadata = {
            name: 'TunnelFi',
            description: 'Connect Your Web3 Wallet',
            url: 'https://web3modal.com',
            icons: ['https://avatars.githubusercontent.com/u/37784886']
        }

        const chains = [bscTestnet]
        defaultWagmiConfig({ chains, projectId, metadata })

        watchAccount((account) => {
            this.$store.commit('setWallet0', account.address)
        })

        const peraWallet = new PeraWalletConnect({
            chainId: this.$algorandTestnet().id,
        });

        peraWallet.reconnectSession().then((accounts) => {
            peraWallet.connector?.on("disconnect", this.peraDisconnect(peraWallet))

            if (peraWallet.isConnected && accounts.length) {
                this.$store.commit('setWallet1', accounts[0])
            }
        }).catch((error) => {
            console.error(error)
        });
    },
    methods: {
        peraDisconnect: async function (peraWallet) {
            peraWallet.disconnect()
            this.$store.commit('setWallet1', null)
        }
    }
}
</script>


<style scoped>
header {
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.tabs {
    border-radius: 40px;
    display: flex;
    align-items: center;
    padding: 6px;
    background: var(--bg-lighter);
}

.tab {
    height: 42px;
    padding: 0 30px;
    display: flex;
    align-items: center;
    border-radius: 30px;
}

.tab p {
    text-align: center;
    font-size: 18px;
    color: white;
}

.tab_active {
    background: white;
}

.tab_active p {
    font-weight: 500;
    color: black;
}

.connect_wallets {
    width: 200px;
    height: 50px;
    color: white;
    border-radius: 6px;
    background: var(--pr);
    font-size: 16px;
    font-weight: 500;
}

.faucet_connect {
    height: 50px;
    font-size: 16px;
    text-decoration: underline;
    color: white;
    cursor: pointer;
    border: none;
    border-radius: 6px;
}
</style>