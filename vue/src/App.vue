
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
import { readApp } from './scripts/bridge';
</script>

<script>
export default {
  async mounted() {
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
  }
}
</script>

<style scoped>
.app {
  background-image: url('/images/hero.png');
  background-position: top center;
  background-repeat: no-repeat;
  background-size: 1440px;
}
</style>
