<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import api from "../utils/api";
import { toast } from "vue-sonner";

const route = useRoute();
const attendance = ref([]);
const loading = ref(true);

const fetchAttendance = async () => {
  try {
    const res = await api.get(`/attendance/${route.params.courseId}`);
    attendance.value = res.data;
  } catch (err) {
    toast.error("Failed to load attendance");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchAttendance();
});
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-text-primary">Attendance Records</h1>
      <p class="text-text-secondary">View and manage attendance for this course</p>
    </div>
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
    </div>
    <div v-else class="card">
      <div class="card-content pt-6">
        <p v-if="attendance.length === 0" class="text-text-secondary">No attendance records yet.</p>
        <ul v-else class="divide-y divide-border">
          <li v-for="(row, index) in attendance" :key="row._id || index" class="py-3 text-text-primary">
            {{ row.date || row.status || JSON.stringify(row) }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
