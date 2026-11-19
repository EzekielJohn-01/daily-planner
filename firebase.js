
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCFdPbzE9vdB7frlLf1OA7Y4F2amiN8UZQ",
    authDomain: "daily-planner-195ab.firebaseapp.com",
    projectId: "daily-planner-195ab",
    storageBucket: "daily-planner-195ab.firebasestorage.app",
    messagingSenderId: "773796987444",
    appId: "1:773796987444:web:4c2310956746281f6a8061"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
