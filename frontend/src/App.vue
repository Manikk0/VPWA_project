<template>
  <router-view />
</template>

<script setup>
import { APP_NAME } from '@/config/app'
import { onMounted } from 'vue'

onMounted(() => {
  document.title = APP_NAME
})
</script>
