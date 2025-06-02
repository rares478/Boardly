<script setup>
import NavBar from './components/NavBar.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const isAuthPage = computed(() => ['/login', '/register'].includes(route.path))
</script>

<template>
  <div id="app" :class="{ 'auth-app': isAuthPage }">
    <NavBar />
    <div v-if="!isAuthPage" class="main-content">
      <router-view />
    </div>
    <router-view v-else />
  </div>
</template>

<style>
.main-content {
  padding-top: 72px;
}
.auth-app {
  max-width: none !important;
  padding: 0 !important;
  display: block !important;
}
@media (min-width: 1024px) {
  .auth-app {
    display: block !important;
    grid-template-columns: none !important;
    padding: 0 !important;
  }
  body {
    display: block !important;
    place-items: initial !important;
  }
}
</style>
