<template>
    <main>
        <section>
            <div class="app_width">
                <div class="borrow_hero">
                    <p class="borrrow_hero_title">Put your idle ALGO tokens to work.</p>
                    <div class="borrow_hero_box">
                        <div class="box_item">
                            <p>Total Supplied</p>
                            <div class="amount">
                                <img src="/images/algo.png" alt="Algo">
                                <p>{{ $toMoney($fromMicroAlgo($store.state.state.total_supply)) }} Algo</p>
                            </div>
                        </div>

                        <div class="box_item">
                            <p>APR</p>
                            <div class="amount">
                                <p>{{ $fromMicroAlgo(calcApr()) }}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section style="margin-top: 40px;">
            <div class="app_width">
                <div class="borrow_app">
                    <div class="context">
                        <div class="tabs">
                            <button :class="tab == 1 ? 'tab tab_active' : 'tab'" @click="tab = 1">
                                <p>Suppy</p>
                            </button>

                            <button :class="tab == 2 ? 'tab tab_active' : 'tab'" @click="tab = 2">
                                <p>Withdraw</p>
                            </button>
                        </div>

                        <div class="borrow" v-if="tab == 1">
                            <div class="borrow_header">
                                <p>Borrow Algo</p>
                            </div>

                            <div class="fields">
                                <div class="input_field">
                                    <div class="input_field_label">
                                        <p>Enter principal amount</p>
                                        <div class="input_collateral">
                                            <img src="/images/algo.png" alt="Wormhole Shares">
                                        </div>
                                    </div>
                                    <input type="number" v-model="supply.amount" placeholder="0.00">
                                    <div class="input_text">Bal: <span>{{ $toMoney($fromMicroAlgo(supply.balance1)) }}
                                            ALGOs</span></div>
                                </div>

                                <div class="principal"></div>

                                <div class="input_field">
                                    <div class="input_field_label">
                                        <p>Reward APR</p>
                                        <div class="input_collateral">
                                            <img src="/images/algo.png" alt="Algo">
                                        </div>
                                    </div>

                                    <div class="principal_amount">
                                        <h3>{{ $fromMicroAlgo(calcApr()) }}%</h3>
                                    </div>
                                </div>
                            </div>

                            <div class="borrow_action">
                                <PrimaryButton :state="$store.state.localState.supplied_amount > 0 ? 'disable' : ''"
                                    @click="useSupply" :progress="supplying"
                                    :text="$store.state.localState.supplied_amount > 0 ? 'Already has a position' : 'Supply'" />
                            </div>
                        </div>

                        <div class="borrow" v-if="tab == 2">
                            <div class="borrow_header">
                                <p>Withdraw Algo</p>
                            </div>

                            <div class="fields">
                                <div class="input_field">
                                    <div class="input_field_label">
                                        <p>Supplied principal</p>
                                        <div class="input_collateral">
                                            <img src="/images/algo.png" alt="ALGO">
                                        </div>
                                    </div>
                                    <input type="number"
                                        :value="$toMoney($fromMicroAlgo($store.state.localState.supplied_amount))" disabled
                                        placeholder="0.00">
                                </div>

                                <div class="principal"></div>

                                <div class="input_field">
                                    <div class="input_field_label">
                                        <p>Interests you have earned</p>
                                        <div class="input_collateral">
                                            <img src="/images/algo.png" alt="Algo">
                                        </div>
                                    </div>

                                    <div class="principal_amount">
                                        <h3>{{ $toMoney($fromMicroAlgo(interest)) }} ALGOs</h3>
                                    </div>
                                </div>
                            </div>

                            <div class="borrow_action">
                                <PrimaryButton :progress="withdrawing"
                                    :state="$store.state.localState.supplied_amount == 0 ? 'disable' : ''"
                                    :text="$store.state.localState.supplied_amount == 0 ? 'You don\'t have a position' : 'Withdraw'"
                                    @click="useWithdraw" />
                            </div>
                        </div>
                    </div>
                    <div class="history">
                        <div class="context">
                            <div class="tabs">
                                <button class="tab tab_active">
                                    <p>Activities</p>
                                </button>
                            </div>

                            <div>
                                <div class="activities">
                                    <table>
                                        <div class="thead">
                                            <thead>
                                                <tr>
                                                    <td>Txn hash</td>
                                                    <td>Action</td>
                                                    <td>Amount</td>
                                                    <td>Timestamp</td>
                                                </tr>
                                            </thead>
                                        </div>
                                        <div class="tbody"
                                            v-for="history, index in activities.filter(h => h.action == 'supply' || h.action == 'withdraw')"
                                            :key="index">
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        <a target="_blank" style="color: var(--text-normal);"
                                                            :href="`https://testnet.algoexplorer.io/tx/${history.hash}`">
                                                            {{ $fineAddress(history.hash) }}
                                                        </a>
                                                    </td>
                                                    <td>{{ history.action }}</td>
                                                    <td>
                                                        <div>
                                                            <img src="/images/algo.png" alt="">
                                                            <p>{{ $toMoney($fromMicroAlgo(history.amount)) }}</p>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {{ $toDate(history.timestamp) }}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </div>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>
</template>

<script setup>
import PrimaryButton from '../components/PrimaryButton.vue'
</script>

<script>
import { notify } from '../reactives/notify';
import { trySupply, tryWithdraw, readOptIn, readApp } from '../scripts/bridge'
import { historyAll } from '../scripts/history';
import { tryAlgoBalance } from '../scripts/token';
export default {
    data() {
        return {
            tab: 1,
            supplying: false,
            withdrawing: false,
            interest: 0,
            activities: [],
            supply: {
                balance1: 0,
                amount: 0
            }
        }
    },
    mounted() {
        this.activities = historyAll()

        this.refreshBalance()
        this.refreshLocalState()
        this.refreshGlobalState()

        setInterval(() => { this.calcEarnedInterest() }, 5 * 1000);
    },
    methods: {
        calcApr: function () {
            return (
                (
                    this.$store.state.state.supply_apr *
                    365 * 24 * 60 * 60
                ) /
                100
            )
        },

        refreshBalance: async function () {
            if (this.$store.state.wallet1) {
                this.supply.balance1 = await tryAlgoBalance(
                    this.$store.state.wallet1
                )
            }
        },

        refreshGlobalState: async function () {
            const appInfo = await readApp()

            if (!appInfo) return

            const globalStates = appInfo.params['global-state'];

            const state = {}

            for (let index = 0; index < globalStates.length; index++) {

                const globalKey = Buffer.from(globalStates[index].key, 'base64').toString();
                const globalValue = Number(globalStates[index].value.uint);

                state[globalKey] = globalValue
            }

            this.$store.commit('setState', state)

            this.activities = historyAll()
        },

        refreshLocalState: async function () {
            if (!this.$store.state.wallet1) return

            const appInfo = await readOptIn(this.$store.state.wallet1);

            if (!appInfo) return

            const localStates = appInfo['app-local-state']['key-value'];

            const state = {}

            for (let index = 0; index < localStates.length; index++) {

                const key = Buffer.from(localStates[index].key, 'base64').toString();
                const value = Number(localStates[index].value.uint);

                state[key] = value
            }

            this.$store.commit('setLocalState', state)
        },

        useSupply: async function () {
            if (this.$store.state.localState.supplied_amount > 0) return

            if (!this.$store.state.wallet1) {
                notify.push({
                    'title': 'Pera wallet not connected!',
                    'description': 'Connect your Pera Wallet',
                    'category': 'error'
                })
                return
            }

            if (this.supply.amount < 1 || this.supply.amount == '') {
                notify.push({
                    'title': 'Amount be must be atleat 1 Algo!',
                    'description': 'Enter a valid ammont',
                    'category': 'error'
                })
                return
            }

            if (this.supplying) return
            this.supplying = true

            const transactionId = await trySupply(
                this.$toMicroAlgo(this.supply.amount)
            )

            if (transactionId) {
                notify.push({
                    'title': 'Transaction sent',
                    'description': 'You have supplied your Algos!',
                    'category': 'success',
                    'linkTitle': 'View Trx',
                    'linkUrl': `https://testnet.algoexplorer.io/tx/${transactionId}`
                })

                this.refreshBalance()
                this.refreshLocalState()
                this.refreshGlobalState()
            } else {
                notify.push({
                    'title': 'Transaction failed',
                    'description': 'Note: you can\'t supply multiple times!',
                    'category': 'error'
                })
            }

            this.supply.amount = ''
            this.supplying = false
        },

        useWithdraw: async function () {
            if (this.$store.state.localState.supplied_amount == 0) return

            if (!this.$store.state.wallet1) {
                notify.push({
                    'title': 'Pera wallet not connected!',
                    'description': 'Connect your Pera Wallet',
                    'category': 'error'
                })
                return
            }

            if (this.withdrawing) return
            this.withdrawing = true

            const transactionId = await tryWithdraw(
                this.$store.state.localState.supplied_amount +
                this.interest
            )

            if (transactionId) {
                notify.push({
                    'title': 'Transaction sent',
                    'description': 'You have withdraw your supplied Algos!',
                    'category': 'success',
                    'linkTitle': 'View Trx',
                    'linkUrl': `https://testnet.algoexplorer.io/tx/${transactionId}`
                })

                this.refreshLocalState()
                this.refreshGlobalState()
            } else {
                notify.push({
                    'title': 'Transaction failed',
                    'description': 'Note: you can\'t withdraw multiple times!',
                    'category': 'error'
                })
            }

            this.withdrawing = false
        },

        calcEarnedInterest: function () {
            this.interest = (
                (
                    this.$store.state.localState.supplied_amount *
                    ((Date.now() / 1000) - this.$store.state.localState.supplied_start_at) *
                    this.$store.state.state.supply_apr
                ) /
                this.$store.state.state.rate_divider
            )
        }
    }
}
</script>

<style scoped>
.borrow_hero {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
    gap: 160px;
    margin-top: 60px;
}

.borrrow_hero_title {
    font-size: 50px;
    line-height: 60px;
    width: 430px;
    color: white;
}

.borrow_hero_box {
    width: 600px;
    border-radius: 6px;
    background: var(--bg);
    border: var(--bg-lighter) solid 2px;
}

.box_item {
    height: 120px;
    padding: 0 30px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: var(--bg-lighter) solid 2px;
}

.box_item .amount {
    display: flex;
    align-items: center;
    gap: 8px;
}

.box_item .amount p {
    font-size: 24px;
    font-weight: 500;
    color: gray;
}

.box_item img {
    width: 24px;
    height: 24px;
}



.box_item:last-child {
    border-bottom: none;
}

.box_item>p {
    color: white;
    font-size: 24px;
    font-weight: 500;
}

.tabs {
    display: flex;
    align-items: center;
}

.tab {
    width: 120px;
    height: 45px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 16px;
    border-bottom: 2px var(--bg-lightest) solid;
    margin-bottom: 20px;
}

.tab_active {
    border-bottom: 2px var(--pr) solid;
}

.borrow_app {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 60px;
}

.borrow {
    border: 2px solid var(--bg-lighter);
    width: 450px;
    border-radius: 6px;
    overflow: hidden;
    background: var(--bg);
}

.borrow_action {
    margin-top: 30px;
    padding: 20px;
    background: var(--bg-lighter);
}

.borrow_header {
    margin-bottom: 20px;
}

.borrow_header p {
    padding: 20px 30px;
    color: white;
    font-size: 16px;
}

.fields {
    padding: 0 30px;
}

.input_field_label {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.input_field_label img {
    width: 20px;
    height: 20px;
}

.input_field_label>p {
    color: gray;
    font-size: 16px;
}

.input_field div {
    display: flex;
    align-items: center;
    gap: 8px;
}

.input_field input {
    height: 50px;
    margin-top: 10px;
    width: 100%;
    border: none;
    padding: 0 10px;
    border-radius: 4px;
    background: var(--bg-lighter);
    font-size: 16px;
    outline: none;
    color: white;
}

.input_text {
    color: gray;
    font-size: 12px;
    margin-top: 4px;
}

.principal {
    margin: 40px 0;
    border-top: 1px solid gray;
}

.principal_amount {
    padding: 10px 0;
}

.principal_amount h3 {
    font-size: 40px;
    color: white;
}

.activities {
    border: 2px solid var(--bg-lighter);
    border-radius: 6px;
    overflow: hidden;
    background: var(--bg);
}

.thead {
    padding: 0 20px;
}

thead {
    height: 60px;
}

thead td {
    width: calc(400px / 3);
    color: white;
    font-size: 14px;
}

.tbody {
    padding: 0 20px;
    background: var(--bg-lighter);
    margin-bottom: 2px;
}

.tbody:last-child {
    margin: 0;
}

tbody {
    height: 80px;
}

tbody img {
    width: 18px;
    height: 18px;
}

tbody td {
    width: calc(400px / 3);
    color: grey;
    font-size: 14px;
}

tbody div {
    display: flex;
    align-items: center;
    gap: 8px;
}

td:last-child {
    text-align: right;
}
</style>