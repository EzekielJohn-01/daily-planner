
import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("login-button");
const errorMessage = document.getElementById("error-message");

// CHECK IF USER IS ALREADY LOGGED IN
onAuthStateChanged(auth, user => {
    if (user) {
        window.location.replace("index.html");
    }
});

// LOGIN
loginForm.addEventListener("submit", async event => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    errorMessage.textContent = "";

    loginButton.disabled = true;
    loginButton.textContent = "Logging in...";

    try {
        await signInWithEmailAndPassword(auth, email, password);

        // DIRECTLY GO TO HOMEPAGE
        // NO SUCCESS POPUP
        window.location.replace("index.html");

    } catch (error) {
        console.error("Login error:", error);

        switch (error.code) {
            case "auth/user-not-found":
                errorMessage.textContent =
                    "Please sign up first.";
                break;

            case "auth/invalid-email":
                errorMessage.textContent =
                    "Please enter a valid email address.";
                break;

            case "auth/invalid-credential":
            case "auth/wrong-password":
                errorMessage.textContent =
                    "Incorrect email or password. If you don't have an account, please sign up first.";
                break;

            case "auth/too-many-requests":
                errorMessage.textContent =
                    "Too many attempts. Please try again later.";
                break;

            case "auth/network-request-failed":
                errorMessage.textContent =
                    "Network error. Please check your internet connection.";
                break;

            default:
                errorMessage.textContent =
                    "Login failed. Please try again.";
        }

        loginButton.disabled = false;
        loginButton.textContent = "Log In";
    }
});