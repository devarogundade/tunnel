
<template>
  <main class="app">
    <AppHeader />
    <RouterView />
    <AppFooter />
  </main>
</template>

<script setup>
import AppHeader from './components/AppHeader.vue';
import AppFooter from './components/AppFooter.vue';
</script>

<style scoped>
.app {
  background-image: url('/src/public/images/wave.png');
  background-position: top center;
  background-repeat: repeat-y;
  background-size: 1440px 800px;
}
</style>
