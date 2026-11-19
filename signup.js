
import { auth } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

const signupForm = document.getElementById("signup-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
const signupButton = document.getElementById("signup-button");
const errorMessage = document.getElementById("error-message");

onAuthStateChanged(auth, user => {
    if (user) {
        window.location.href = "index.html";
    }
});

signupForm.addEventListener("submit", async event => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    errorMessage.textContent = "";

    if (password !== confirmPassword) {
        errorMessage.textContent = "Passwords do not match.";
        return;
    }

    if (password.length < 6) {
        errorMessage.textContent = "Password must be at least 6 characters.";
        return;
    }

    signupButton.disabled = true;
    signupButton.textContent = "Creating Account...";

    try {
        await createUserWithEmailAndPassword(auth, email, password);

        alert("Your account has been created successfully!");

        window.location.href = "index.html";

    } catch (error) {
        console.error("Sign up error:", error);

        switch (error.code) {
            case "auth/email-already-in-use":
                alert("This email is already registered. Please log in instead.");
                break;

            case "auth/invalid-email":
                errorMessage.textContent = "Please enter a valid email address.";
                break;

            case "auth/weak-password":
                errorMessage.textContent = "Password must be at least 6 characters.";
                break;

            case "auth/network-request-failed":
                errorMessage.textContent =
                    "Network error. Please check your internet connection.";
                break;

            default:
                errorMessage.textContent =
                    "Unable to create account. Please try again.";
        }

        signupButton.disabled = false;
        signupButton.textContent = "Create Account";
    }
});
