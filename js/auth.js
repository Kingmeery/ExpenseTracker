import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

// this file runs on both pages, so not all of these will exist every time
const authForm = document.getElementById("auth-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authError = document.getElementById("auth-error");
const toggleModeBtn = document.getElementById("toggle-mode");
const authTitle = document.getElementById("auth-title");
const authSubmitBtn = document.getElementById("auth-submit");
const signOutBtn = document.getElementById("sign-out-btn");
const userEmailEl = document.getElementById("user-email");

let isSignUpMode = false;

// switches the form between sign in / sign up - only on login.html
if (toggleModeBtn) {
  toggleModeBtn.addEventListener("click", () => {
    isSignUpMode = !isSignUpMode;

    authTitle.textContent = isSignUpMode ? "Create your account" : "Welcome back";
    authSubmitBtn.textContent = isSignUpMode ? "Sign up" : "Sign in";
    toggleModeBtn.textContent = isSignUpMode
      ? "Already have an account? Sign in"
      : "New here? Create an account";

    authError.textContent = "";
  });
}

// only on login.html
if (authForm) {
  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    authError.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
      if (isSignUpMode) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      window.location.href = "index.html";
    } catch (error) {
      authError.textContent = error.message;
    }
  });
}

// only on index.html
if (signOutBtn) {
  signOutBtn.addEventListener("click", () => signOut(auth));
}

// runs on both pages - redirects depending on login state
onAuthStateChanged(auth, (user) => {
  const onLoginPage = window.location.pathname.endsWith("login.html");

  if (user) {
    if (onLoginPage) window.location.href = "index.html";
    if (userEmailEl) userEmailEl.textContent = user.email;
  } else {
    if (!onLoginPage) window.location.href = "login.html";
  }
});