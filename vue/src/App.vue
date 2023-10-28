
<template>
  <main>
    <AppHeader />
    <RouterView />
    <AppFooter />
  </main>
</template>

<script setup>
import AppHeader from './components/AppHeader.vue';
import AppFooter from './components/AppFooter.vue';
</script>
