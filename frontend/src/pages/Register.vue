<script setup>
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { toast } from "vue-sonner";
import { Eye, EyeOff, Mail, Lock, User, Hash } from "lucide-vue-next";
import { useAuthStore } from "../stores/auth";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const showPassword = ref(false);
const isLoading = ref(false);
const name = ref("");
const role = ref("");
const rollNo = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const invitationToken = ref(route.query.token || "");

if (route.query.role === "teacher" || route.query.role === "admin") {
  role.value = route.query.role;
}

const hasInvitation = computed(() => Boolean(route.query.token));

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    toast.error("Passwords do not match");
    return;
  }
  if (!role.value) {
    toast.error("Role is required");
    return;
  }
  if (role.value === "student" && !rollNo.value) {
    toast.error("Roll number is required for students");
    return;
  }
  if ((role.value === "teacher" || role.value === "admin") && !invitationToken.value) {
    toast.error("Invitation token is required for teacher/admin registration");
    return;
  }
  if (!email.value) {
    toast.error("Email is required");
    return;
  }

  isLoading.value = true;
  try {
    await authStore.register({
      email: email.value,
      password: password.value,
      name: name.value,
      role: role.value,
      rollNo: rollNo.value,
      invitationToken: invitationToken.value,
    });
    toast.success("Registration successful");
    router.push("/dashboard");
  } catch (err) {
    toast.error(
      err.response?.data?.error || err.message || "Failed to register"
    );
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
          {{ hasInvitation ? "Complete Your Registration" : "Create your account" }}
        </h2>
        <p class="mt-2 text-center text-sm text-text-secondary">
          {{ hasInvitation ? "You've been invited to join the system" : "Or sign in to your existing account" }}
          <router-link
            v-if="!hasInvitation"
            to="/login"
            class="font-medium text-accent hover:text-accent-secondary ml-1"
          >
            here
          </router-link>
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-text-primary">Full Name</label>
            <div class="mt-1 relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User class="h-5 w-5 text-text-muted" />
              </div>
              <input v-model="name" type="text" required class="input pl-10" placeholder="Enter your full name" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary">Role</label>
            <select v-model="role" class="input" required :disabled="hasInvitation">
              <option value="">Select your role</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option v-if="hasInvitation" value="admin">Admin</option>
            </select>
            <p v-if="hasInvitation" class="mt-1 text-sm text-accent-success">✓ You have a valid invitation</p>
          </div>

          <div v-if="role === 'student'">
            <label class="block text-sm font-medium text-text-primary">
              Roll Number <span class="text-accent-error">*</span>
            </label>
            <div class="mt-1 relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash class="h-5 w-5 text-text-muted" />
              </div>
              <input v-model="rollNo" type="text" class="input pl-10" placeholder="Enter your roll number" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary">
              Email Address
              <span v-if="role === 'admin'" class="text-accent-error">*</span>
            </label>
            <div class="mt-1 relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail class="h-5 w-5 text-text-muted" />
              </div>
              <input v-model="email" type="email" required class="input pl-10" placeholder="Enter your email" />
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

          <div>
            <label class="block text-sm font-medium text-text-primary">Confirm Password</label>
            <div class="mt-1 relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock class="h-5 w-5 text-text-muted" />
              </div>
              <input
                v-model="confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                required
                class="input pl-10"
                placeholder="Confirm your password"
              />
            </div>
          </div>
        </div>

        <button type="submit" :disabled="isLoading" class="btn btn-primary btn-lg w-full">
          {{ isLoading ? "Creating account..." : "Create account" }}
        </button>
      </form>
    </div>
  </div>
</template>
