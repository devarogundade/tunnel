<template>
    <main>
        <section>
            <div class="app_width">
                <div class="borrow_hero">
                    <p class="borrrow_hero_title">Put your idle ALGO tokens to work.</p>
                    <div class="borrow_hero_box">
                        <div class="box_item">
                            <p>Liquidity</p>
                            <div class="amount">
                                <img src="../public/images/algo.png" alt="Algo">
                                <p>1,000,323 Algo</p>
                            </div>
                        </div>

                        <div class="box_item">
                            <p>APR</p>
                            <div class="amount">
                                <img src="../public/images/algo.png" alt="Algo">
                                <p>8.31%</p>
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
                                        <p>Enter collateral amount</p>
                                        <div class="input_collateral">
                                            <img src="../public/images/algo.png" alt="Wormhole Shares">
                                        </div>
                                    </div>
                                    <input type="number" placeholder="0.00">
                                    <div class="input_text">Balance: <span>100.00 WORMHOLE SHARES</span></div>
                                </div>

                                <div class="principal"></div>

                                <div class="input_field">
                                    <div class="input_field_label">
                                        <p>Principal (You will get)</p>
                                        <div class="input_collateral">
                                            <img src="../public/images/algo.png" alt="Algo">
                                        </div>
                                    </div>

                                    <div class="principal_amount">
                                        <h3>100 ALGO</h3>
                                    </div>
                                </div>
                            </div>

                            <div class="borrow_action">
                                <PrimaryButton :text="'Supply'" />
                            </div>
                        </div>

                        <div class="borrow" v-if="tab == 2">
                            <div class="borrow_header">
                                <p>Repay Algo</p>
                            </div>

                            <div class="fields">
                                <div class="input_field">
                                    <div class="input_field_label">
                                        <p>Enter principal amount</p>
                                        <div class="input_collateral">
                                            <img src="../public/images/algo.png" alt="ALGO">
                                        </div>
                                    </div>
                                    <input type="number" placeholder="0.00">
                                    <div class="input_text">Balance: <span>100.00 ALGO</span></div>
                                </div>

                                <div class="principal"></div>

                                <div class="input_field">
                                    <div class="input_field_label">
                                        <p>Collateral (You will get)</p>
                                        <div class="input_collateral">
                                            <img src="../public/images/algo.png" alt="Algo">
                                        </div>
                                    </div>

                                    <div class="principal_amount">
                                        <h3>50 W SHARES...</h3>
                                    </div>
                                </div>
                            </div>

                            <div class="borrow_action">
                                <PrimaryButton :text="'Withdraw'" />
                            </div>
                        </div>
                    </div>
                    <div class="history">
                        <div class="context">
                            <div class="tabs" style="justify-content: flex-end;">
                                <button class="tab tab_active">
                                    <p>Activities</p>
                                </button>
                            </div>

                            <div style="display: flex; justify-content: flex-end;">
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
                                        <div class="tbody" v-for="index in 6">
                                            <tbody>
                                                <tr>
                                                    <td>Ox1234...56</td>
                                                    <td>Supply</td>
                                                    <td>
                                                        <div>
                                                            <img src="../public/images/algo.png" alt="">
                                                            <p>0.02</p>
                                                        </div>
                                                    </td>
                                                    <td>12:30, Saturday 23</td>
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
export default {
    data() {
        return {
            tab: 1
        }
    },
    methods: {}
}
</script>

<style scoped>
.borrow_hero {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: space-between;
    margin-top: 60px;
}

.borrrow_hero_title {
    font-size: 50px;
    line-height: 60px;
    width: 400px;
    color: white;
}

.borrow_hero_box {
    border: white solid 1px;
    width: 600px;
    border-radius: 6px;
}

.box_item {
    height: 120px;
    padding: 0 30px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: white solid 1px;
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
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.borrow {
    border: 2px solid var(--bg-lighter);
    width: 450px;
    border-radius: 6px;
    overflow: hidden;
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
    height: 60px;
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