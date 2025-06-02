<template>
  <div class="auth-page">
    <div class="auth-container card">
      <h2>Login</h2>
      <form @submit.prevent="onLogin">
        <div>
          <label>Email</label>
          <input v-model="email" type="email" required />
        </div>
        <div>
          <label>Password</label>
          <input v-model="password" type="password" required />
        </div>
        <button type="submit" class="btn" :disabled="auth.loading">Login</button>
        <p v-if="auth.error" class="error">{{ auth.error }}</p>
      </form>
      <router-link to="/register">Don't have an account? Register</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store';

const email = ref('');
const password = ref('');
const auth = useAuthStore();
const router = useRouter();

const onLogin = async () => {
  await auth.login(email.value, password.value);
};

watch(() => auth.token, (token) => {
  if (token) router.push('/dashboard');
});
</script>

<style scoped>
.auth-container {
  max-width: 400px;
  margin: 0;
  padding: 2.5rem 2rem;
  border-radius: 10px;
  background: var(--color-card);
  box-shadow: var(--color-shadow);
  text-align: center;
}
.auth-page {
  position: fixed;
  top: 72px; /* height of navbar */
  left: 0;
  width: 100vw;
  height: calc(100vh - 72px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  z-index: 10;
}
form {
  margin-bottom: 1rem;
}
.error {
  color: #e74c3c;
  margin-top: 1rem;
}
.auth-page, .auth-container {
  color: var(--color-text) !important;
}
</style> 