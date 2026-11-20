
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

// EXISTING MODALS
const profileModal = document.getElementById("profile-modal");
const aboutModal = document.getElementById("about-modal");
const modalProfileEmail = document.getElementById("modal-profile-email");

// CONFIRMATION MODALS
const logoutConfirmModal = document.getElementById("logout-confirm-modal");
const passwordConfirmModal = document.getElementById("password-confirm-modal");

const confirmLogoutButton = document.getElementById("confirm-logout-button");
const confirmPasswordButton = document.getElementById("confirm-password-button");

const passwordConfirmEmail = document.getElementById("password-confirm-email");

const logoutStatus = document.getElementById("logout-status");
const passwordStatus = document.getElementById("password-status");

// CURRENT USER
let currentUser = null;

// HELPER FUNCTIONS
function closeProfileMenu() {
    profileMenu.classList.remove("show");
    profileToggle.setAttribute("aria-expanded", "false");
}

function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `confirmation-status show ${type}`;
}

function resetStatus(element) {
    element.textContent = "";
    element.className = "confirmation-status";
}

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
        closeProfileMenu();
    }
});

// CLOSE DROPDOWN AND MODALS WITH ESCAPE
document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeProfileMenu();

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
    closeProfileMenu();
});

// OPEN ABOUT APP
aboutAppButton.addEventListener("click", () => {
    aboutModal.classList.add("show");
    closeProfileMenu();
});

// OPEN CHANGE PASSWORD CONFIRMATION
changePasswordButton.addEventListener("click", () => {
    if (!currentUser || !currentUser.email) {
        return;
    }

    resetStatus(passwordStatus);

    confirmPasswordButton.disabled = false;
    confirmPasswordButton.textContent = "Send Link";

    passwordConfirmEmail.textContent = currentUser.email;

    passwordConfirmModal.classList.add("show");

    closeProfileMenu();
});

// CONFIRM CHANGE PASSWORD
confirmPasswordButton.addEventListener("click", async () => {
    if (!currentUser || !currentUser.email) {
        showStatus(
            passwordStatus,
            "Unable to find your account email.",
            "error"
        );
        return;
    }

    try {
        confirmPasswordButton.disabled = true;
        confirmPasswordButton.textContent = "Sending...";

        await sendPasswordResetEmail(auth, currentUser.email);

        showStatus(
            passwordStatus,
            "Password reset email sent! Please check your inbox.",
            "success"
        );

        confirmPasswordButton.textContent = "Sent";

    } catch (error) {
        console.error("Password reset error:", error);

        showStatus(
            passwordStatus,
            "Unable to send password reset email. Please try again.",
            "error"
        );

        confirmPasswordButton.disabled = false;
        confirmPasswordButton.textContent = "Send Link";
    }
});

// OPEN LOGOUT CONFIRMATION
logoutButton.addEventListener("click", () => {
    resetStatus(logoutStatus);

    confirmLogoutButton.disabled = false;
    confirmLogoutButton.textContent = "Log Out";

    logoutConfirmModal.classList.add("show");

    closeProfileMenu();
});

// CONFIRM LOGOUT
confirmLogoutButton.addEventListener("click", async () => {
    try {
        confirmLogoutButton.disabled = true;
        confirmLogoutButton.textContent = "Logging out...";

        await signOut(auth);

        window.location.replace("login.html");

    } catch (error) {
        console.error("Logout error:", error);

        showStatus(
            logoutStatus,
            "Unable to log out. Please try again.",
            "error"
        );

        confirmLogoutButton.disabled = false;
        confirmLogoutButton.textContent = "Log Out";
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
