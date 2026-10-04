<script setup>
defineProps({
  title: { type: String, default: "Coming soon" },
});
</script>

<template>
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">{{ title }}</h3>
      <p class="card-description">This page uses the same layout as the React app and will be filled in next.</p>
    </div>
    <div class="card-content">
      <p class="text-text-secondary">The navigation and styling match the React frontend.</p>
    </div>
  </div>
</template>
