<template>
    <main>
        <section>
            <div class="app_width">
                <div class="borrow_hero">
                    <p class="borrrow_hero_title">Take crypto loans with your real world assets.</p>
                    <div class="borrow_hero_box">
                        <div class="box_item">
                            <p>Liquidity</p>
                            <div class="amount">
                                <img src="/images/algo.png" alt="Algo">
                                <p>1,000,323 Algo</p>
                            </div>
                        </div>

                        <div class="box_item">
                            <p>LTV Ratio</p>
                            <div class="amount">
                                <img src="/images/algo.png" alt="Algo">
                                <p>120 Percent</p>
                            </div>
                        </div>

                        <div class="box_item">
                            <p>APR</p>
                            <div class="amount">
                                <img src="/images/algo.png" alt="Algo">
                                <p>120 Percent</p>
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
                            <button class="tab tab_active">
                                <p>Borrow</p>
                            </button>

                            <button class="tab">
                                <p>Repay</p>
                            </button>
                        </div>

                        <div class="borrow">
                            <div class="borrow_header">
                                <p>Borrow Algo</p>
                            </div>

                            <div class="borrow_action">
                                <PrimaryButton :text="'Borrow'" />
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
    height: 80px;
    padding: 0 30px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: white solid 1px;
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
    margin-top: 450px;
    padding: 20px;
    background: var(--bg-lighter);
}

.borrow_header p {
    padding: 20px 30px;
    color: white;
    font-size: 20px;
}
</style>