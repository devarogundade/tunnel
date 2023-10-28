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

                <button @click="open" class="connect_wallets">
                    <p>Connect Wallets</p>
                </button>
            </header>
        </div>
    </section>
</template>

<script setup>
import TunnelLogo from '../components/icons/TunnelLogo.vue'
</script>

<script>
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/vue'
import { bscTestnet } from '@wagmi/core/chains'

const projectId = import.meta.env.VITE_PROJECT_ID

export default {
    data() {
        return {
            modal: null
        }
    },
    methods: {
        connect0: async function () {
            const metadata = {
                name: 'TunnelFi',
                description: 'Connect Your Web3 Wallet',
                url: 'https://web3modal.com',
                icons: ['https://avatars.githubusercontent.com/u/37784886']
            }

            const chains = [bscTestnet]
            const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata })

            if (!this.modal) {
                this.modal = createWeb3Modal({ wagmiConfig, projectId, chains, defaultChain: bscTestnet })
                this.modal.open()
            } else {
                this.modal.open({ view: 'Account' })
            }
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
</style>