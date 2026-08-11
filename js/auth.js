import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
const authForm = document.getElementById("auth-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authError = document.getElementById("auth-error");
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
const toggleModeBtn = document.getElementById("toggle-mode");
const authTitle = document.getElementById("auth-title");
const authSubmitBtn = document.getElementById("auth-submit");

let isSignUpMode = false;

toggleModeBtn.addEventListener("click", () => {
  isSignUpMode = !isSignUpMode;

  authTitle.textContent = isSignUpMode ? "Create your account" : "Welcome back";
  authSubmitBtn.textContent = isSignUpMode ? "Sign up" : "Sign in";
  toggleModeBtn.textContent = isSignUpMode
    ? "Already have an account? Sign in"
    : "New here? Create an account";

  authError.textContent = "";
});