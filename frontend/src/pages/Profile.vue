<script setup>
import { computed } from "vue";
import { useAuthStore } from "../stores/auth";

const authStore = useAuthStore();
const user = computed(() => authStore.user);
const firstLetter = computed(
  () => user.value?.name?.charAt(0).toUpperCase() || "?"
);
</script>

<template>
  <div class="space-y-6">
    <div class="card">
      <div class="card-content pt-6">
        <div class="flex items-center space-x-4">
          <div class="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-white font-semibold text-xl">
            {{ firstLetter }}
          </div>
          <div>
            <h1 class="text-2xl font-bold text-text-primary">{{ user?.name }}</h1>
            <p class="text-text-secondary capitalize">{{ user?.role }}</p>
            <p class="text-sm text-text-muted">{{ user?.email }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Profile Information</h3>
          <p class="card-description">Your personal details from the attendance system</p>
        </div>
        <div class="card-content space-y-4">
          <div>
            <label class="block text-sm font-medium text-text-secondary">Name</label>
            <p class="mt-1 text-lg text-text-primary">{{ user?.name }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary">Email</label>
            <p class="mt-1 text-lg text-text-primary">{{ user?.email || "—" }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary">Role</label>
            <p class="mt-1 text-lg text-text-primary capitalize">{{ user?.role }}</p>
          </div>
          <div v-if="user?.rollNo">
            <label class="block text-sm font-medium text-text-secondary">Roll Number</label>
            <p class="mt-1 text-lg text-text-primary">{{ user.rollNo }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
