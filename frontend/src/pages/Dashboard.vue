<script setup>
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "../stores/auth";
import api from "../utils/api";
import { BookOpen, Users } from "lucide-vue-next";

const authStore = useAuthStore();
const user = computed(() => authStore.user);

const stats = ref(null);
const recentCourses = ref([]);
const loading = ref(true);

const fetchDashboardData = async () => {
  try {
    const res = await api.get("/courses");
    const courses = res.data;
    recentCourses.value = courses.slice(0, 5);

    const totalCourses = courses.length;
    const totalStudents =
      user.value?.role === "student"
        ? 0
        : courses.reduce((acc, c) => acc + (c.studentCount || c.students?.length || 0), 0);

    stats.value = {
      totalCourses,
      totalStudents,
      recentActivity: courses.length,
    };
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDashboardData();
});
</script>

<template>
  <div v-if="loading" class="flex justify-center items-center h-64">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
  </div>
  <div v-else class="space-y-6">
    <div class="card">
      <div class="card-content pt-6">
        <h1 class="text-2xl font-bold text-text-primary">Welcome back, {{ user?.name }}! 👋</h1>
        <p class="text-text-secondary mt-1">Here's what's happening with your attendance today.</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="card">
        <div class="card-content pt-6">
          <p class="text-sm font-medium text-text-secondary">Total Courses</p>
          <p class="text-2xl font-bold text-text-primary mt-1">{{ stats?.totalCourses || 0 }}</p>
        </div>
      </div>
      <div v-if="user?.role !== 'student'" class="card">
        <div class="card-content pt-6">
          <p class="text-sm font-medium text-text-secondary">Total Students</p>
          <p class="text-2xl font-bold text-text-primary mt-1">{{ stats?.totalStudents || 0 }}</p>
        </div>
      </div>
      <div class="card">
        <div class="card-content pt-6">
          <p class="text-sm font-medium text-text-secondary">Recent Activity</p>
          <p class="text-2xl font-bold text-text-primary mt-1">{{ stats?.recentActivity || 0 }}</p>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Recent Courses</h3>
      </div>
      <div class="card-content">
        <div v-if="recentCourses.length > 0" class="space-y-4">
          <router-link
            v-for="course in recentCourses"
            :key="course._id"
            :to="`/courses/${course._id}`"
            class="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <div class="flex items-center space-x-4">
              <div class="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <BookOpen class="h-5 w-5 text-accent" />
              </div>
              <div>
                <h4 class="font-medium text-text-primary">{{ course.name }}</h4>
                <p class="text-sm text-text-secondary">{{ course.code }}</p>
              </div>
            </div>
            <div v-if="user?.role !== 'student'" class="flex items-center text-text-secondary text-sm">
              <Users class="h-4 w-4 mr-1" />
              {{ course.studentCount || course.students?.length || 0 }}
            </div>
          </router-link>
        </div>
        <div v-else class="text-center py-8">
          <BookOpen class="h-12 w-12 text-text-muted mx-auto mb-4" />
          <h3 class="text-lg font-medium text-text-primary mb-2">No courses yet</h3>
          <p class="text-text-secondary">You haven't been enrolled in or created any courses yet.</p>
        </div>
      </div>
    </div>
  </div>
</template>
