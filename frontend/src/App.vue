<script setup>
import { Toaster } from "vue-sonner";
</script>

<template>
  <div class="min-h-screen bg-background">
    <router-view />
    <Toaster position="top-right" theme="dark" />
  </div>
</template>
