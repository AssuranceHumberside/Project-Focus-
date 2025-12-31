import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCtLq0oOWyKb_R8Eff86G4XG54xP49uFyg",
  authDomain: "project-focus-2.firebaseapp.com",
  projectId: "project-focus-2",
  storageBucket: "project-focus-2.firebasestorage.app",
  messagingSenderId: "442223918612",
  appId: "1:442223918612:web:45b50f767725d7adc2b101"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentStep = 0;
let userProgress = {};
let changeHistory = {};

// ... [Sections array remains the same as previous turn] ...

// NEW: Toggle between Login and Registration UI
window.toggleAuthMode = () => {
    const isLogin = document.getElementById('auth-title').innerText === "Welcome Back.";
    document.getElementById('auth-title').innerText = isLogin ? "Create Account" : "Welcome Back.";
    document.getElementById('auth-desc').innerText = isLogin ? "Join Project FOCUS today." : "Please authenticate to continue.";
    document.getElementById('login-btn').classList.toggle('hidden');
    document.getElementById('register-btn').classList.toggle('hidden');
};

// NEW: Self-Registration Logic
window.handleRegister = async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    
    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCred.user;
        
        // Create Initial Profile in Firestore
        await setDoc(doc(db, "users", user.uid), {
            email: email,
            role: "auditor",
            isVerified: false, // Admin must verify before they can submit
            createdAt: new Date().toISOString()
        });
        
        alert("Account created! Please ask your District Lead to verify your access.");
        location.reload();
    } catch (e) { alert("Registration Error: " + e.message); }
};

window.handleLogin = async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try {
        const userCred = await signInWithEmailAndPassword(auth, email, pass);
        const userDoc = await getDoc(doc(db, "project_focus_records", userCred.user.uid));
        
        if (userDoc.exists()) {
            userProgress = userDoc.data().responses || {};
            changeHistory = userDoc.data().history || {};
            currentStep = findFirstUnresolvedSection();
        }
        
        document.getElementById('auth-ui').classList.add('hidden');
        document.getElementById('audit-ui').classList.remove('hidden');
        document.getElementById('progress-container').classList.remove('hidden');
        renderStep();
    } catch (e) { alert("Login Error: " + e.message); }
};

// ... [renderStep, saveField, and Navigation functions remain the same] ...
