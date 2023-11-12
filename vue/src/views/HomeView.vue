<template>
    <section>
        <div class="app_width">
            <div class="hero">
                <div class="hero_text">
                    <h3>
                        Leveraging Real World Assets to unlock more liquidity on Algorand.
                    </h3>

                    <p>Unlock the full potential of your real world assets in a secure, transparent, and inclusive
                        financial ecosystem.
                    </p>

                    <RouterLink to="/bridge">
                        <div class="launch_app">
                            <p>Launch App</p>
                            <ArrowRightIcon style="width: 30px; height: 30px;" />
                        </div>
                    </RouterLink>
                </div>
            </div>

            <div class="features_container">
                <div class="features">
                    <div class="feature" style="background-image: url('/images/feature1.png');">
                        <div class="feature_overlay">
                            <h3>Bridge</h3>
                            <p>Transfer your RWAs between Algorand and other chains like BSC, Ethereum, ...</p>
                            <RouterLink to="/bridge">
                                <button>Bridge RWAs</button>
                            </RouterLink>
                        </div>
                    </div>
                    <div class="feature" style="background-image: url('/images/feature2.png');">
                        <div class="feature_overlay">
                            <h3>Borrow</h3>
                            <p>Use your real world assets as collateral to secure crypto loans.</p>
                            <RouterLink to="/borrow">
                                <button>Borrow ALGOs</button>
                            </RouterLink>
                        </div>
                    </div>
                    <div class="feature" style="background-image: url('/images/feature3.png');">
                        <div class="feature_overlay">
                            <h3>Supply</h3>
                            <p>Put your idle ALGO tokens to work and start earning passive yield.</p>
                            <RouterLink to="/supply">
                                <button>Supply ALGOs</button>
                            </RouterLink>
                        </div>
                    </div>
                </div>

                <div class="feature snipe" style="background-image: url('/images/feature1.png');">
                    <div class="feature_overlay">
                        <h3>Snipe</h3>
                        <p>Buy liquidated loan's collateral at cheaper rate to market value from Algorand to other networks.
                        </p>
                        <RouterLink to="/snipe">
                            <button>Snipe RWAs</button>
                        </RouterLink>
                    </div>
                </div>
            </div>

            <div class="arch">
                <p>Flow Diagram.</p>
                <img src="/images/arch.png" alt="">
            </div>
        </div>
    </section>
</template>

<script setup>
import { RouterLink } from 'vue-router';
import ArrowRightIcon from '../components/icons/ArrowRightIcon.vue'
</script>

<style scoped>
section {
    padding-top: 60px;
}


.hero_text {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.hero_text h3 {
    font-size: 50px;
    line-height: 65px;
    color: var(--text-normal);
    width: 1000px;
    max-width: 100%;
}

.hero_text>p {
    margin-top: 30px;
    font-size: 24px;
    color: gray;
    width: 1000px;
    max-width: 100%;
}

.launch_app {
    height: 100px;
    width: 340px;
    background: var(--pr);
    border-radius: 6px;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-top: 60px;
}

.launch_app p {
    color: var(--text-normal);
    font-size: 24px;
    font-weight: 600;
}


.features_container {
    padding: 100px 0;
}

.features {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 20px;
}

.feature {
    background-repeat: no-repeat;
    background-size: cover;
    position: relative;
    width: 390px;
    max-width: 100%;
    height: 650px;
    border-radius: 6px;
    overflow: hidden;
}

.feature_overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    backdrop-filter: blur(12px);
    background-color: rgba(2, 3, 76, 0.6);
    padding: 30px;
    display: flex;
    justify-content: flex-end;
    flex-direction: column;
}

.feature img {
    height: 100px;
    width: 100px;
    object-fit: contain;
    margin-bottom: 60px;
}

.feature h3 {
    margin-bottom: 10px;
    font-size: 30px;
    color: var(--text-normal);
    font-weight: 500;
}

.feature p {
    font-size: 16px;
    color: gray;
    line-height: 24px;
    margin-bottom: 20px;
    font-weight: 300;
}

.feature button {
    width: 200px;
    height: 50px;
    border: none;
    background: white;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 600;
    color: var(--bg);
}

.snipe {
    width: 100%;
    margin-top: 40px;
    height: 200px;
}

.snipe .feature_overlay {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-end;
}

.snipe h3,
.snipe p {
    width: 100% !important;
}

.arch p {
    font-size: 36px;
    text-align: center;
    color: var(--text-normal);
    font-weight: 500;
}

.arch {
    display: flex;
    justify-content: center;
    flex-direction: column;
}

.arch img {
    width: 100%;
}
</style>