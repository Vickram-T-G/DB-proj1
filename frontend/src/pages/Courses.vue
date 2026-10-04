<script setup>
import { ref, onMounted, computed } from "vue";
import { Plus, BookOpen, Users } from "lucide-vue-next";
import api from "../utils/api";
import { useAuthStore } from "../stores/auth";

const authStore = useAuthStore();
const user = computed(() => authStore.user);
const courses = ref([]);
const loading = ref(true);

const fetchCourses = async () => {
  try {
    const res = await api.get("/courses");
    courses.value = res.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchCourses();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">Courses</h1>
        <p class="text-text-secondary">Manage your courses and attendance</p>
      </div>
      <router-link
        v-if="user?.role === 'teacher' || user?.role === 'admin'"
        to="/courses/new"
        class="btn btn-primary"
      >
        <Plus class="h-4 w-4 mr-2" />
        Create Course
      </router-link>
    </div>

    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
    </div>
    <div v-else-if="courses.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <router-link
        v-for="course in courses"
        :key="course._id"
        :to="`/courses/${course._id}`"
        class="card hover:shadow-xl transition-all duration-300 hover:border-accent/30"
      >
        <div class="card-content pt-6">
          <div class="flex items-start justify-between mb-4">
            <div class="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <BookOpen class="h-6 w-6 text-accent" />
            </div>
            <span class="badge badge-secondary font-mono">{{ course.code }}</span>
          </div>
          <h3 class="text-lg font-semibold text-text-primary mb-2">{{ course.name }}</h3>
          <p class="text-text-secondary text-sm mb-4 line-clamp-2">
            {{ course.description || "No description available" }}
          </p>
          <div class="flex items-center text-sm text-text-secondary">
            <Users class="h-4 w-4 mr-2" />
            {{ course.studentCount || course.students?.length || 0 }} students
          </div>
        </div>
      </router-link>
    </div>
    <div v-else class="card">
      <div class="card-content pt-6 text-center py-8">
        <BookOpen class="h-12 w-12 text-text-muted mx-auto mb-4" />
        <h3 class="text-lg font-medium text-text-primary mb-2">No courses yet</h3>
        <p class="text-text-secondary">Courses will appear here once they are created or assigned.</p>
      </div>
    </div>
  </div>
</template>
