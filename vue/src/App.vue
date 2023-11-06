
<template>
  <main class="app">
    <AppHeader />
    <RouterView />
    <AppFooter />

    <SnackbarPop />
  </main>
</template>

<script setup>
import AppHeader from './components/AppHeader.vue';
import AppFooter from './components/AppFooter.vue';
import SnackbarPop from './components/SnackbarPop.vue';
</script>

<style scoped>
.app {
  background-image: url('/images/wave.png');
  background-position: top center;
  background-repeat: repeat-y;
  background-size: 1440px 800px;
}
</style>
