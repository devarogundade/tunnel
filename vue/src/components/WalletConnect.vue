<template>
    <div class="container">
        <div class="wrapper">
            <div class="header">
                <p>Connect Wallets</p>
                <CloseIcon class="header_close" />
            </div>
        </div>
    </div>
</template>

<script setup>
import CloseIcon from '../components/icons/CloseIcon.vue'
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
}

.wrapper {
    width: 430px;
    height: 500px;
    border-radius: 8px;
    border: 2px solid var(--bg-lighter);
    background: var(--bg-light);
}
</style>
