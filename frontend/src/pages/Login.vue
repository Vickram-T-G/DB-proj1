<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { toast } from "vue-sonner";
import { Eye, EyeOff, Mail, Lock, Hash } from "lucide-vue-next";
import { useAuthStore } from "../stores/auth";

const authStore = useAuthStore();
const router = useRouter();

const showPassword = ref(false);
const isLoading = ref(false);
const loginMethod = ref("email");
const email = ref("");
const rollNo = ref("");
const password = ref("");

const handleLogin = async () => {
  isLoading.value = true;
  try {
    await authStore.login({
      password: password.value,
      ...(loginMethod.value === "email"
        ? { email: email.value }
        : { rollNo: rollNo.value }),
    });
    toast.success("Login successful!");
    router.push("/dashboard");
  } catch (err) {
    toast.error(err.response?.data?.error || err.message || "Failed to login");
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-text-primary">
          Sign in to your account
        </h2>
        <p class="mt-2 text-center text-sm text-text-secondary">
          Or
          <router-link to="/register" class="font-medium text-accent hover:text-accent-secondary">
            create a new account
          </router-link>
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="space-y-4">
          <div class="flex space-x-2 p-1 bg-surface-secondary rounded-lg">
            <button
              type="button"
              class="flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors"
              :class="loginMethod === 'email' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'"
              @click="loginMethod = 'email'"
            >
              Email
            </button>
            <button
              type="button"
              class="flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors"
              :class="loginMethod === 'rollNo' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'"
              @click="loginMethod = 'rollNo'"
            >
              Roll Number
            </button>
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary">
              {{ loginMethod === "email" ? "Email Address" : "Roll Number" }}
            </label>
            <div class="mt-1 relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail v-if="loginMethod === 'email'" class="h-5 w-5 text-text-muted" />
                <Hash v-else class="h-5 w-5 text-text-muted" />
              </div>
              <input
                v-if="loginMethod === 'email'"
                v-model="email"
                type="email"
                required
                class="input pl-10"
                placeholder="Enter your email"
              />
              <input
                v-else
                v-model="rollNo"
                type="text"
                required
                class="input pl-10"
                placeholder="Enter your roll number"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary">Password</label>
            <div class="mt-1 relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock class="h-5 w-5 text-text-muted" />
              </div>
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                minlength="6"
                class="input pl-10 pr-10"
                placeholder="Enter your password"
              />
              <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center" @click="showPassword = !showPassword">
                <EyeOff v-if="showPassword" class="h-5 w-5 text-text-muted hover:text-text-secondary" />
                <Eye v-else class="h-5 w-5 text-text-muted hover:text-text-secondary" />
              </button>
            </div>
          </div>
        </div>

        <button type="submit" :disabled="isLoading" class="btn btn-primary btn-lg w-full">
          {{ isLoading ? "Signing in..." : "Sign in" }}
        </button>
      </form>
    </div>
  </div>
</template>
