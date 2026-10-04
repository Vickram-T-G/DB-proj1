<script setup>
import { ref } from "vue";

const events = ref([]);
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-text-primary">Calendar & Events</h1>
      <p class="text-text-secondary">Track classes and important dates</p>
    </div>
    <div class="card h-96 flex items-center justify-center">
      <p class="text-text-secondary">
        {{ events.length === 0 ? "No events scheduled yet." : `${events.length} events` }}
      </p>
    </div>
  </div>
</template>
