import { defineStore } from "pinia";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import api from "../utils/api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    loading: true,
    token: null,
  }),
  actions: {
    setSession(token, user) {
      this.token = token;
      this.user = user;
      if (token) {
        localStorage.setItem("token", token);
      }
    },
    async fetchProfile() {
      const response = await api.get("/auth/me");
      this.user = response.data;
      return this.user;
    },
    async init() {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, async () => {
          try {
            const storedToken = localStorage.getItem("token");
            if (storedToken) {
              this.token = storedToken;
              await this.fetchProfile();
            } else {
              this.user = null;
              this.token = null;
            }
          } catch (error) {
            console.error("Failed to fetch MongoDB profile", error);
            localStorage.removeItem("token");
            this.user = null;
            this.token = null;
          } finally {
            this.loading = false;
            resolve();
          }
        });
      });
    },
    async login({ email, rollNo, password }) {
      if (email) {
        await signInWithEmailAndPassword(auth, email, password);
      }
      const response = await api.post("/auth/login", {
        password,
        ...(email ? { email } : {}),
        ...(rollNo ? { rollNo } : {}),
      });
      const { token, ...userData } = response.data;
      this.setSession(token, userData);
    },
    async register({
      email,
      password,
      name,
      role,
      rollNo,
      invitationToken,
    }) {
      let credential;
      try {
        credential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
      } catch (error) {
        if (error.code === "auth/email-already-in-use") {
          credential = await signInWithEmailAndPassword(auth, email, password);
        } else {
          throw error;
        }
      }

      const payload = {
        firebaseUid: credential.user.uid,
        email,
        password,
        name,
        role,
        ...(role === "student" && rollNo ? { rollNo } : {}),
        ...(invitationToken ? { invitationToken } : {}),
      };

      const response = await api.post("/auth/register", payload);
      const { token, ...user } = response.data;
      this.setSession(token, user);
    },
    async logout() {
      localStorage.removeItem("token");
      if (auth.currentUser) {
        await signOut(auth);
      }
      this.user = null;
      this.token = null;
    },
  },
});
