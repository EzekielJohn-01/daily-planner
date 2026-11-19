import { auth } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

// PROFILE ELEMENTS
const profileToggle = document.getElementById("profile-toggle");
const profileMenu = document.getElementById("profile-menu");
const profileEmail = document.getElementById("profile-email");
const profileMenuAvatar = document.getElementById("profile-menu-avatar");

// MENU BUTTONS
const logoutButton = document.getElementById("logout-button");
const myProfileButton = document.getElementById("my-profile-button");
const changePasswordButton = document.getElementById("change-password-button");
const aboutAppButton = document.getElementById("about-app-button");

// MODAL ELEMENTS
const profileModal = document.getElementById("profile-modal");
const aboutModal = document.getElementById("about-modal");
const modalProfileEmail = document.getElementById("modal-profile-email");

// CURRENT USER
let currentUser = null;

// AUTHENTICATION CHECK
onAuthStateChanged(auth, user => {
    if (user) {
        currentUser = user;

        const email = user.email || "No email available";
        const initial = email.charAt(0).toUpperCase() || "U";

        profileEmail.textContent = email;
        profileToggle.textContent = initial;
        profileMenuAvatar.textContent = initial;
        modalProfileEmail.textContent = email;

        document.body.style.visibility = "visible";
    } else {
        window.location.replace("login.html");
    }
});

// OPEN AND CLOSE PROFILE DROPDOWN
profileToggle.addEventListener("click", event => {
    event.stopPropagation();

    const isOpen = profileMenu.classList.toggle("show");

    profileToggle.setAttribute("aria-expanded", isOpen);
});

// CLOSE DROPDOWN WHEN CLICKING OUTSIDE
document.addEventListener("click", event => {
    if (
        !profileMenu.contains(event.target) &&
        !profileToggle.contains(event.target)
    ) {
        profileMenu.classList.remove("show");
        profileToggle.setAttribute("aria-expanded", "false");
    }
});

// CLOSE DROPDOWN AND MODALS WITH ESCAPE
document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        profileMenu.classList.remove("show");
        profileToggle.setAttribute("aria-expanded", "false");

        document.querySelectorAll(".profile-modal.show").forEach(modal => {
            modal.classList.remove("show");
        });
    }
});

// OPEN MY PROFILE
myProfileButton.addEventListener("click", () => {
    if (!currentUser) return;

    modalProfileEmail.textContent =
        currentUser.email || "No email available";

    profileModal.classList.add("show");

    profileMenu.classList.remove("show");
    profileToggle.setAttribute("aria-expanded", "false");
});

// OPEN ABOUT APP
aboutAppButton.addEventListener("click", () => {
    aboutModal.classList.add("show");

    profileMenu.classList.remove("show");
    profileToggle.setAttribute("aria-expanded", "false");
});

// CHANGE PASSWORD
changePasswordButton.addEventListener("click", async () => {
    if (!currentUser || !currentUser.email) {
        alert("Unable to find your account email.");
        return;
    }

    const confirmReset = confirm(
        "Send a password reset link to " + currentUser.email + "?"
    );

    if (!confirmReset) return;

    try {
        await sendPasswordResetEmail(auth, currentUser.email);

        alert("Password reset email sent! Please check your inbox.");

        profileMenu.classList.remove("show");
        profileToggle.setAttribute("aria-expanded", "false");

    } catch (error) {
        console.error("Password reset error:", error);

        alert("Unable to send password reset email. Please try again.");
    }
});

// CLOSE MODALS USING CLOSE BUTTONS
document.querySelectorAll("[data-close-modal]").forEach(button => {
    button.addEventListener("click", () => {
        const modalId = button.dataset.closeModal;

        document.getElementById(modalId).classList.remove("show");
    });
});

// CLOSE MODALS WHEN CLICKING OUTSIDE
document.querySelectorAll(".profile-modal").forEach(modal => {
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            modal.classList.remove("show");
        }
    });
});

// LOGOUT
logoutButton.addEventListener("click", async () => {
    const confirmLogout = confirm(
        "Are you sure you want to log out?"
    );

    if (!confirmLogout) return;

    try {
        await signOut(auth);

        window.location.replace("login.html");

    } catch (error) {
        console.error("Logout error:", error);

        alert("Unable to log out. Please try again.");
    }
});