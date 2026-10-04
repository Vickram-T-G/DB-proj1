<script setup>
import { ref, computed } from "vue";
import { useAuthStore } from "../stores/auth";
import { useRoute, useRouter } from "vue-router";
import {
  Menu,
  X,
  Home,
  BookOpen,
  Calendar,
  User,
  Settings,
  LogOut,
  Users,
  Mail,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from "lucide-vue-next";

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const sidebarOpen = ref(false);
const sidebarCollapsed = ref(false);

const user = computed(() => authStore.user);

const handleLogout = async () => {
  await authStore.logout();
  router.push("/login");
};

const navigation = computed(() => {
  const role = user.value?.role;
  const nav = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Courses", href: "/courses", icon: BookOpen },
  ];
  if (role === "admin" || role === "teacher") {
    nav.push({ name: "Add Course", href: "/courses/new", icon: Calendar });
  }
  nav.push({ name: "Calendar", href: "/calendar", icon: Calendar });
  if (role === "admin") {
    nav.push(
      { name: "Admin Panel", href: "/admin", icon: Settings },
      { name: "Manage Users", href: "/admin/users", icon: Users },
      { name: "Invitations", href: "/admin/invitations", icon: Mail },
      { name: "Excel Import", href: "/admin/excel-import", icon: FileSpreadsheet }
    );
  }
  nav.push({ name: "Profile", href: "/profile", icon: User });
  return nav;
});

const isActive = (href) => {
  if (
    href === "/dashboard" ||
    href === "/courses" ||
    href === "/admin" ||
    href === "/admin/users" ||
    href === "/profile"
  ) {
    return route.path === href;
  }
  return (
    route.path === href ||
    (route.path.startsWith(href + "/") && href !== "/courses" && href !== "/admin")
  );
};

const getPageTitle = computed(() => {
  const p = route.path;
  if (p === "/dashboard") return "Dashboard";
  if (p === "/courses") return "Courses";
  if (p === "/courses/new") return "Add Course";
  if (p.startsWith("/courses/")) return "Course Details";
  if (p === "/calendar") return "Calendar";
  if (p === "/admin") return "Admin Panel";
  if (p === "/admin/users") return "Manage Users";
  if (p === "/admin/invitations") return "Invitations";
  if (p === "/admin/excel-import") return "Excel Import";
  if (p === "/profile") return "Profile";
  return "Dashboard";
});

const firstLetter = computed(
  () => user.value?.name?.charAt(0).toUpperCase() || "?"
);
</script>

<template>
  <div class="min-h-screen bg-background flex">
    <div
      :class="[
        'hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 lg:bg-surface lg:border-r lg:border-border transition-all duration-300 ease-in-out',
        sidebarCollapsed ? 'lg:w-16' : 'lg:w-64',
      ]"
    >
      <div class="flex h-16 items-center justify-between px-6 border-b border-border">
        <h1 v-if="!sidebarCollapsed" class="text-xl font-bold text-text-primary">Attendance</h1>
        <button
          class="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
          @click="sidebarCollapsed = !sidebarCollapsed"
        >
          <ChevronRight v-if="sidebarCollapsed" :size="20" />
          <ChevronLeft v-else :size="20" />
        </button>
      </div>
      <nav class="flex-1 px-4 py-6 space-y-2">
        <router-link
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          :class="['nav-link', isActive(item.href) ? 'nav-link-active' : '', sidebarCollapsed ? 'justify-center' : '']"
          :title="sidebarCollapsed ? item.name : ''"
        >
          <component :is="item.icon" :size="20" :class="sidebarCollapsed ? '' : 'mr-3'" />
          <span v-if="!sidebarCollapsed">{{ item.name }}</span>
        </router-link>
      </nav>
      <div class="border-t border-border p-4">
        <div :class="['flex items-center', sidebarCollapsed ? 'justify-center' : 'mb-4']">
          <div
            class="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white font-semibold cursor-pointer"
            @click="router.push('/profile')"
          >
            {{ firstLetter }}
          </div>
          <div v-if="!sidebarCollapsed" class="ml-3">
            <p class="text-sm font-medium text-text-primary">{{ user?.name }}</p>
            <p class="text-xs text-text-secondary capitalize">{{ user?.role }}</p>
          </div>
        </div>
        <button
          :class="['w-full nav-link text-left', sidebarCollapsed ? 'justify-center' : '']"
          :title="sidebarCollapsed ? 'Logout' : ''"
          @click="handleLogout"
        >
          <LogOut :size="20" :class="sidebarCollapsed ? '' : 'mr-3'" />
          <span v-if="!sidebarCollapsed">Logout</span>
        </button>
      </div>
    </div>

    <div v-show="sidebarOpen" class="lg:hidden fixed inset-0 z-50">
      <div class="fixed inset-0 bg-black bg-opacity-50" @click="sidebarOpen = false"></div>
      <div class="fixed left-0 top-0 h-full w-64 bg-surface border-r border-border">
        <div class="flex h-16 items-center justify-between px-6 border-b border-border">
          <h1 class="text-xl font-bold text-text-primary">Attendance</h1>
          <button
            class="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
            @click="sidebarOpen = false"
          >
            <X :size="20" />
          </button>
        </div>
        <nav class="flex-1 px-4 py-6 space-y-2">
          <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            :class="['nav-link', isActive(item.href) ? 'nav-link-active' : '']"
            @click="sidebarOpen = false"
          >
            <component :is="item.icon" :size="20" class="mr-3" />
            {{ item.name }}
          </router-link>
        </nav>
        <div class="border-t border-border p-4">
          <div class="flex items-center mb-4">
            <div class="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white font-semibold">
              {{ firstLetter }}
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-text-primary">{{ user?.name }}</p>
              <p class="text-xs text-text-secondary capitalize">{{ user?.role }}</p>
            </div>
          </div>
          <button class="w-full nav-link text-left" @click="handleLogout">
            <LogOut :size="20" class="mr-3" />
            Logout
          </button>
        </div>
      </div>
    </div>

    <div :class="['flex-1 flex flex-col transition-all duration-300 ease-in-out', sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64']">
      <header class="bg-surface border-b border-border px-6 py-4">
        <div class="flex items-center justify-between">
          <button
            class="lg:hidden p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
            @click="sidebarOpen = true"
          >
            <Menu :size="20" />
          </button>
          <div class="flex items-center space-x-4">
            <h2 class="text-lg font-semibold text-text-primary">{{ getPageTitle }}</h2>
          </div>
          <div class="flex items-center space-x-4">
            <div class="hidden md:flex items-center space-x-3">
              <div
                class="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white font-semibold text-sm cursor-pointer"
                @click="router.push('/profile')"
              >
                {{ firstLetter }}
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-text-primary">{{ user?.name }}</p>
                <p class="text-xs text-text-secondary capitalize">{{ user?.role }}</p>
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" title="Logout" @click="handleLogout">
              <LogOut :size="16" class="mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>
      <main class="flex-1 p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
