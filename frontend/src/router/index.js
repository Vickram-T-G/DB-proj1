import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";
import Layout from "../components/Layout.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "Login",
      component: () => import("../pages/Login.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/register",
      name: "Register",
      component: () => import("../pages/Register.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/",
      component: Layout,
      meta: { requiresAuth: true },
      children: [
        { path: "", redirect: "/dashboard" },
        {
          path: "dashboard",
          name: "Dashboard",
          component: () => import("../pages/Dashboard.vue"),
        },
        {
          path: "courses",
          name: "Courses",
          component: () => import("../pages/Courses.vue"),
        },
        {
          path: "courses/new",
          name: "CreateCourse",
          component: () => import("../pages/Placeholder.vue"),
        },
        {
          path: "courses/:id",
          name: "CourseDetail",
          component: () => import("../pages/Placeholder.vue"),
        },
        {
          path: "attendance/:courseId",
          name: "Attendance",
          component: () => import("../pages/Attendance.vue"),
        },
        {
          path: "calendar",
          name: "Calendar",
          component: () => import("../pages/Calendar.vue"),
        },
        {
          path: "profile",
          name: "Profile",
          component: () => import("../pages/Profile.vue"),
        },
        {
          path: "admin",
          name: "Admin",
          component: () => import("../pages/Placeholder.vue"),
        },
        {
          path: "admin/users",
          name: "AdminUsers",
          component: () => import("../pages/Placeholder.vue"),
        },
        {
          path: "admin/invitations",
          name: "AdminInvitations",
          component: () => import("../pages/Placeholder.vue"),
        },
        {
          path: "admin/excel-import",
          name: "ExcelImport",
          component: () => import("../pages/Placeholder.vue"),
        },
      ],
    },
    { path: "/:pathMatch(.*)*", redirect: "/dashboard" },
  ],
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  if (authStore.loading) {
    await authStore.init();
  }

  const isAuthenticated = !!authStore.user;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: "Login" });
  } else if (to.matched.some((record) => record.meta.requiresAuth) && !isAuthenticated) {
    next({ name: "Login" });
  } else if (to.meta.requiresGuest && isAuthenticated) {
    next({ name: "Dashboard" });
  } else {
    next();
  }
});

export default router;
