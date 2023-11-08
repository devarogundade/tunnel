<template>
    <section id="section">
        <div class="app_width">
            <div class="container">
                <div class="bridge_rect">
                    <div class="bridge_rect_toolbar">
                        <p>Bridge</p>
                        <RefreshIcon @click="refreshAllowance(); refreshBalance()" />
                    </div>

                    <div class="form_rect" :style="{ transform: interchange ? 'translateY(275px)' : '' }">
                        <div class="from_toolbar">
                            <p class="from_label0">{{ interchange ? 'To' : 'From' }}</p>
                            <div class="from_chain">
                                <div class="active_from_chain" @click="froming = !froming">
                                    <img :src="bridge.from.chain.image" alt="">
                                    <p>{{ bridge.from.chain.name }}</p>
                                    <ArrowDownIcon />
                                </div>

                                <!-- dropdown -->
                                <div class="inactive_from_chains" v-show="froming" @click="froming = !froming"
                                    :style="{ top: interchange ? '-35px' : '205px' }">
                                    <div class="chain" v-for="chain, index in [$bscTestnet()]"
                                        @click="bridge.from.chain = chain; bridge.currency = $wormholeSharesInBsc()"
                                        :key="index">
                                        <img :src="chain.image" alt="">
                                        <p>{{ chain.name }}</p>
                                        <SemanticGreen v-if="bridge.from.chain.id == chain.id" />
                                        <SemanticGreen v-else-if="bridge.to.chain.id == chain.id" />
                                    </div>
                                </div>
                            </div>
                            <div class="from_connection" @click="connection = true" v-if="!$store.state.wallet0">
                                <SemanticRed />
                                <p>Connect</p>
                            </div>
                            <div class="from_connection" v-else>
                                <SemanticGreen />
                                <p>Connected</p>
                            </div>
                        </div>

                        <div class="from_input">
                            <div style="display: flex; gap: 16px;">
                                <div class="est" v-if="interchange">Est.</div>
                                <div class="max" v-else>Max</div>
                                <input type="number" v-model="bridge.amount" placeholder="0.00">
                            </div>
                            <div class="currency" @click="coining = !coining">
                                <img :src="bridge.currency.image" alt="">
                                <p>{{ bridge.currency.name }}</p>
                                <ArrowDownIcon v-if="!interchange" />

                                <!-- dropdown -->
                                <div class="inactive_from_currencies" v-if="coining && !interchange">
                                    <div class="currency" v-for="currency, index in [$wormholeSharesInBsc()]"
                                        @click="bridge.currency = currency" :key="index">
                                        <img :src="currency.image" alt="">
                                        <p>{{ currency.name }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="from_balance">
                            <p>~${{ $toMoney(($store.state.prices[bridge.currency.symbol] * bridge.amount)) }}</p>
                            <p>Bal: <span>{{ $toMoney($fromWei(bridge.balance0)) }}</span></p>
                        </div>

                    </div>

                    <div class="inter_change" @click="interchange = !interchange">
                        <InterChangeIcon :style="{ transform: interchange ? 'rotate(180deg)' : '' }" />
                        <SwapIcon :style="{ transform: interchange ? 'rotate(180deg)' : '' }" />
                    </div>

                    <div class="to_rect" :style="{ transform: interchange ? 'translateY(-280px)' : '' }">
                        <div class="to_toolbar">
                            <p class="from_label0">{{ !interchange ? 'To' : 'From' }}</p>
                            <div class="to_chain">
                                <div class="active_to_chain">
                                    <img :src="bridge.to.chain.image" alt="">
                                    <p>{{ bridge.to.chain.name }}</p>
                                </div>
                            </div>
                            <div class="to_connection" @click="connection = true" v-if="!$store.state.wallet1">
                                <SemanticRed />
                                <p>Connect</p>
                            </div>
                            <div class="to_connection" v-else>
                                <SemanticGreen />
                                <p>Connected</p>
                            </div>
                        </div>

                        <div class="to_input">
                            <div style="display: flex; gap: 16px;">
                                <div class="est" v-if="!interchange">Est.</div>
                                <div class="max" v-else>Max</div>
                                <input type="number" v-model="bridge.amount" placeholder="0.00">
                            </div>
                            <div class="currency" @click="coining = !coining">
                                <img :src="bridge.currency.image" alt="">
                                <p>{{ bridge.currency.name }}</p>
                                <ArrowDownIcon v-if="interchange" />

                                <!-- dropdown -->
                                <div class="inactive_from_currencies" v-if="coining && interchange">
                                    <div class="currency" v-for="currency, index in [$wormholeSharesInAlgo()]"
                                        @click="bridge.currency = currency" :key="index">
                                        <img :src="currency.image" alt="">
                                        <p>{{ currency.name }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="to_balance">
                            <p>~${{ $toMoney(($store.state.prices[bridge.currency.symbol] * bridge.amount)) }}</p>
                            <p>Bal: <span>{{ $toMoney($fromWei(bridge.balance1) * 1_000_000_000) }}</span></p>
                        </div>
                    </div>

                    <div class="view_route">
                        <PrimaryButton v-if="$fromWei(allowance) < bridge.amount" :progress="approving"
                            :text="'Approve ' + bridge.currency.symbol" @click="approve" />
                        <PrimaryButton v-else :progress="bridging || approving" :text="'Bridge'" @click="useBridge" />
                    </div>

                    <div class="schedule">
                        <div class="est_time">
                            <p>Est. time</p>
                            <div>
                                <TimeIcon />
                                <p>2 - 5 mins</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <WalletConnect @close="connection = false" v-if="connection" />
    </section>
</template>

<script setup>
import WalletConnect from '@/components/WalletConnect.vue'
import ArrowDownIcon from '@/components/icons/ArrowDownIcon.vue'
import RefreshIcon from '@/components/icons/RefreshIcon.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import SemanticGreen from '@/components/icons/SemanticGreen.vue'
import SemanticRed from '@/components/icons/SemanticRed.vue'
import InterChangeIcon from '@/components/icons/InterChangeIcon.vue'
import SwapIcon from '@/components/icons/SwapIcon.vue'
import TimeIcon from '@/components/icons/TimeIcon.vue'
</script>

<script>
import { notify } from '../reactives/notify'
import { tryBridge, tryUnBridge } from '../scripts/bridge'
import { tryErcBalance, tryErcAllocation, tryErcApprove } from '../scripts/token'
export default {
    watch: {
        bridge: {
            handler: function () {
                this.refreshAllowance()
                this.refreshBalance()
            },
            deep: true
        },
        'bridge.amount': function () {
            this.refreshAllowance()
            this.refreshBalance()
        },
        'bridge.currency': function () {
            this.refreshAllowance()
            this.refreshBalance()
        },
        'bridge.from.chain': function () {
            this.refreshAllowance()
            this.refreshBalance()
        }
    },
    data() {
        return {
            connection: false,
            froming: false,
            coining: false,
            interchange: false,
            bridging: false,
            approving: false,
            allowance: 0,
            bridge: {
                balance0: '0',
                balance1: '0',
                currency: this.$wormholeSharesInBsc(),
                bridgeFee: 0,
                amount: 0,
                from: {
                    chain: this.$bscTestnet()
                },
                to: {
                    chain: this.$algorandTestnet()
                },
            },
        }
    },
    mounted() {
        this.refreshAllowance()
        this.refreshBalance()
    },
    methods: {
        refreshBalance: async function () {
            if (this.$store.state.wallet0) {
                this.bridge.balance0 = await tryErcBalance(
                    this.$store.state.wallet0
                )
            }
        },
        refreshAllowance: async function () {
            if (this.interchange) {
                this.allowance = '100000000000000000000000000'
                return
            }

            if (this.$store.state.wallet0) {
                this.allowance = await tryErcAllocation(
                    this.$store.state.wallet0
                )
            }
        },
        approve: async function () {
            if (this.approving) return
            this.approving = true

            await tryErcApprove(
                this.$toWei(this.bridge.amount)
            )

            this.refreshAllowance()

            this.approving = false
        },
        useBridge: async function () {
            if (this.bridging) return

            if (this.bridge.amount == '') {
                notify.push({
                    'title': 'Enter an amount!',
                    'description': 'Field is required!',
                    'category': 'error'
                })
                return
            }

            this.bridging = true

            let fromChainId = this.bridge.from.chain
            let destChain = this.bridge.to.chain

            if (this.interchange) {
                let tempFrom = fromChainId
                fromChainId = destChain
                destChain = tempFrom
            }

            let receiver
            if (fromChainId.id == 97) {
                receiver = this.$store.state.wallet0
            } else {
                receiver = this.$store.state.wallet1
            }

            if (fromChainId.id == 97) {
                if (receiver == '') {
                    notify.push({
                        'title': 'Receiving wallet not connected!',
                        'description': 'Connect your Pera Wallet',
                        'category': 'error'
                    })
                    this.bridging = false
                    return
                }

                const transaction = await tryBridge(
                    this.$toWei(this.bridge.amount)
                )

                if (transaction && transaction.transactionHash) {
                    notify.push({
                        'title': 'Transaction sent',
                        'description': 'View transaction at the transactions page!',
                        'category': 'success',
                        'linkTitle': 'View Trx',
                        'linkUrl': `https://testnet.bscsacn.com/tx/${transaction.transactionHash}`
                    })
                } else {
                    notify.push({
                        'title': 'Transaction failed',
                        'description': 'Try again!',
                        'category': 'error'
                    })
                }
            } else if (fromChainId.id == 416002) {
                if (receiver == '') {
                    notify.push({
                        'title': 'Receiving wallet not connected!',
                        'description': 'Connect your EVM Wallet',
                        'category': 'error'
                    })
                    this.bridging = false
                    return
                }

                const txId = await tryUnBridge(
                    this.$store.state.wallet1
                )

                if (txId) {
                    notify.push({
                        'title': 'Transaction sent',
                        'description': 'View transaction at the transactions page!',
                        'category': 'success',
                        'linkTitle': 'View Trx',
                        'linkUrl': `https://testnet.bscsacn.com/tx/${transaction.transactionHash}`
                    })
                } else {
                    notify.push({
                        'title': 'Transaction failed',
                        'description': 'Try again!',
                        'category': 'error'
                    })
                }
            }

            this.bridging = false
            this.refreshBalance()
        }
    }
}
</script>

<style scoped>
.container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 60px;
    padding-top: 60px;
    flex-direction: column;
}

.bridge_rect {
    width: 500px;
    max-width: 100%;
    flex-shrink: 0;
    border-radius: 8px;
    border: 2px solid var(--bg-lighter);
    padding: 24px;
    background: var(--bg);
}

.bridge_rect_toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 3px 0;
}

.bridge_rect_toolbar p {
    color: var(--text-normal);
    font-size: 20px;
    font-style: normal;
    font-weight: 800;
}

.bridge_rect_toolbar svg {
    display: inline-flex;
    padding: 9px;
    align-items: flex-start;
    gap: 10px;
    border-radius: 8px;
    background: var(--bg-lighter);
    width: 38px;
    height: 38px;
    cursor: pointer;
}

.form_rect,
.to_rect {
    border-radius: 8px;
    background: var(--bg-lighter);
    margin-top: 20px;
    padding: 0 16px;
    padding-bottom: 24px;
}

.from_toolbar,

.to_toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-image: linear-gradient(to right, var(--pr-light) 3%, var(--bg-lightest) 3%, var(--bg-lightest) 97%, var(--pr-light) 97%) 1;
    border-bottom-width: 1px;
    border-bottom-style: solid;
}

.active_from_chain,
.active_to_chain {
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid var(--pr);
    height: 56px;
    padding: 0 14px;
    position: relative;
    user-select: none;
    cursor: pointer;
}

.active_from_chain img,
.active_to_chain img {
    width: 24px;
    height: 24px;
    border-radius: 12px;
}

.active_from_chain p,
.active_to_chain p {
    color: var(--text-normal, #EEF1F8);
    font-size: 16px;
    font-style: normal;
    font-weight: 800;
    line-height: 100%;
    /* 16px */
    letter-spacing: 0.32px;
}

.inactive_from_chains {
    border-radius: 6px;
    border: 1px solid var(--bg-lightest);
    background: var(--bg);
    position: absolute;
    transform: translate(-50%, 100px);
    left: 50%;
    z-index: 3;
    width: 200px;
    padding: 0 16px;
    user-select: none;
}

.inactive_from_chains .chain {
    height: 64px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.inactive_from_chains p {
    color: var(--text-normal, #EEF1F8);
    font-size: 16px;
    font-style: normal;
    font-weight: 800;
    line-height: 100%;
    /* 16px */
    letter-spacing: 0.32px;
    width: 120px;
}

.inactive_from_chains img {
    width: 24px;
    height: 24px;
    border-radius: 12px;
}


.from_chain>svg,
.to_chain>svg {
    margin-left: 2px;
}

.from_label0,
.to_label0 {
    color: var(--text-dimmed, #66676C);
    font-size: 16px;
    font-style: normal;
    font-weight: 500;

    /* 19.2px */
    letter-spacing: 0.32px;
    width: 110px;
}

.from_connection,
.to_connection {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 110px;
    justify-content: flex-end;
    cursor: pointer;
    user-select: none;
}

.from_connection p,
.to_connection p {
    color: var(--text-dimmed, #66676C);
    font-size: 12px;
    font-style: normal;
    font-weight: 500;

    /* 14.4px */
    letter-spacing: 0.24px;
}

.from_input,
.to_input {
    margin-top: 30px;
    display: flex;
    gap: 16px;
    justify-content: space-between;
}

.max,
.est {
    width: 65px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    border-radius: 3px;
    background: var(--bg-lightest, #11282E);
    color: var(--primary-primary, #9FD629);
    font-size: 14px;
    font-style: normal;
    font-weight: 500;

    /* 16.8px */
    letter-spacing: 0.28px;
}

.est {
    color: var(--text-semi-d, #95979D);
}

.from_input input,
.to_input input {
    width: 120px;
    color: var(--text-normal, #EEF1F8);
    font-size: 20px;
    font-style: normal;
    font-weight: 900;
    line-height: 100%;
    /* 20px */

    background: transparent;
    border: none;
    outline: none;
}

.from_input .currency,
.to_input .currency {
    display: flex;
    align-items: center;
    gap: 6px;
    position: relative;
    cursor: pointer;
}

.currency img {
    width: 24px;
    height: 24px;
    border-radius: 12px;
}

.currency p {
    color: var(--text-normal);
    font-size: 16px;
    font-style: normal;
    font-weight: 800;
    line-height: 100%;
    /* 16px */
    letter-spacing: 0.32px;
}

.currency>svg {
    margin-left: 2px;
}

.inactive_from_currencies {
    position: relative;
    border-radius: 6px;
    border: 1px solid var(--bg-lightest);
    background: var(--bg);
    position: absolute;
    transform: translate(-50%, 0);
    top: 35px;
    left: 50%;
    z-index: 3;
    width: 240px;
    padding: 0 16px;
}

.inactive_from_currencies .currency {
    border-bottom: 1px solid var(--bg-lighter, #0C171A);
    height: 64px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.from_balance,
.to_balance {
    margin-top: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.from_balance p,
.to_balance p {
    color: var(--text-dimmed, #66676C);
    font-size: 14px;
    font-style: normal;
    font-weight: 500;

    /* 16.8px */
    letter-spacing: 0.28px;
}

.from_balance p span,
.to_balance p span {
    color: var(--text-normal, #EEF1F8);
    font-weight: 800;
}

.inter_change {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    cursor: pointer;
    user-select: none;
    position: relative;
}

.inter_change svg:last-child {
    position: absolute;
}


.view_route {
    margin-top: 40px;
}

.schedule {
    margin-top: 20px;
}

.est_time {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 52px;
}

.est_time>p {
    color: var(--tx-normal, #EEF1F8);
    font-size: 16px;
    font-style: normal;
    font-weight: 500;

    /* 19.2px */
    letter-spacing: 0.32px;
}

.est_time div {
    display: flex;
    align-items: center;
    gap: 10px;
}

.est_time div p {
    color: var(--tx-dimmed, #66676C);
    font-size: 14px;
    font-style: normal;
    font-weight: 500;

    /* 16.8px */
    letter-spacing: 0.28px;
}
</style>