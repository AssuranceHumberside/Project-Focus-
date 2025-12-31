import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// FIX: Improved Toggle Logic
window.toggleAuthMode = () => {
    const title = document.getElementById('auth-title');
    const desc = document.getElementById('auth-desc');
    const regFields = document.getElementById('register-fields');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const toggleLink = document.getElementById('toggle-link');

    if (title.innerText === "Welcome Back.") {
        title.innerText = "Join Project FOCUS";
        desc.innerText = "Create your auditor account.";
        regFields.classList.remove('hidden');
        loginBtn.classList.add('hidden');
        registerBtn.classList.remove('hidden');
        toggleLink.innerText = "Already have an account? Sign In";
    } else {
        title.innerText = "Welcome Back.";
        desc.innerText = "Please authenticate to continue.";
        regFields.classList.add('hidden');
        loginBtn.classList.remove('hidden');
        registerBtn.classList.add('hidden');
        toggleLink.innerText = "Need an account? Register here";
    }
};

window.handleRegister = async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const profile = {
        name: document.getElementById('reg-name').value,
        district: document.getElementById('reg-district').value,
        group: document.getElementById('reg-group').value,
        section: document.getElementById('reg-section').value,
        isVerified: false,
        createdAt: new Date().toISOString()
    };

    if (!profile.district || !profile.name) return alert("Please fill in all registration fields.");

    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "users", userCred.user.uid), profile);
        
        // Show the verification message
        document.getElementById('auth-ui').innerHTML = `
            <div class="bg-white p-10 rounded-[2.5rem] shadow-2xl border-t-8 border-[#ffe627] text-center">
                <h2 class="text-2xl font-black text-[#003945] uppercase mb-4">Account Created!</h2>
                <p class="text-slate-600 mb-6">
                    Please bear with us whilst we verify your account! This usually takes up to 48hrs. 
                    Check back soon and try logging in with your email and password.
                </p>
                <p class="text-sm text-slate-400">
                    Any issues, contact <a href="mailto:assurance@humbersidescouts.org.uk" class="text-[#003945] font-bold underline">assurance@humbersidescouts.org.uk</a>.
                </p>
                <button onclick="location.reload()" class="mt-8 bg-[#003945] text-white px-8 py-3 rounded-full font-black uppercase text-xs">Return to Login</button>
            </div>
        `;
    } catch (e) { alert("Registration Error: " + e.message); }
};

// ... Rest of your handleLogin and audit logic ...
