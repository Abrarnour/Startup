<script setup>
import { ref, onMounted } from 'vue'
import OnboardingWizard from './OnboarDingwizard.vue'
import ClientPortal from './ClientPortal.vue'

const isLoggedIn = ref(false)

onMounted(() => {
  isLoggedIn.value = !!localStorage.getItem('client_token')
})

function onClientLoggedIn() {
  isLoggedIn.value = true
}
</script>

<template>
  <ClientPortal v-if="isLoggedIn" />
  <OnboardingWizard v-else @client-logged-in="onClientLoggedIn" />
</template>