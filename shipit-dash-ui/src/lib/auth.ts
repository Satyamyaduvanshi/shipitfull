// src/lib/auth.ts

const USER_ID_KEY = "shipit_user_id";
const USERNAME_KEY = "shipit_username";

export function setAuthSession(userId: string, username?: string) {
  localStorage.setItem(USER_ID_KEY, userId);
  if (username) {
    localStorage.setItem(USERNAME_KEY, username);
  }
}

export function getUserId() {
  return localStorage.getItem(USER_ID_KEY);
}

// THIS WAS MISSING - ADD THIS NOW
export function getUsername() {
  return localStorage.getItem(USERNAME_KEY) || "User";
}

export function clearAuthSession() {
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

export function isAuthenticated() {
  return !!localStorage.getItem(USER_ID_KEY);
}