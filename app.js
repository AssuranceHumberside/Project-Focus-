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

let currentStep = 0;
let userProgress = {};
let profileData = {};

// ... (Sections array same as previous turns) ...

window.toggleAuthMode = () => {
    const title = document.getElementById('auth-title');
    const isLogin = title.innerText === "Welcome Back.";
    title.innerText = isLogin ? "Join Project FOCUS" : "Welcome Back.";
    document.getElementById('register-fields').classList.toggle('hidden');
    document.getElementById('login-btn').classList.toggle('hidden');
    document.getElementById('register-btn').classList.toggle('hidden');
    document.getElementById('toggle-link').innerText = isLogin ? "Already have an account? Sign In" : "Need an account? Register here";
};

window.handleRegister = async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const profile = {
        email: email, // Explicitly saved for Admin Pull
        username: email,
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
        
        document.getElementById('auth-ui').innerHTML = `
            <div class="bg-white p-10 rounded-[2.5rem] shadow-2xl border-t-8 border-[#ffe627] text-center">
                <h2 class="text-2xl font-black text-[#003945] uppercase mb-4 italic">Account Created!</h2>
                <p class="text-slate-600 mb-6">
                    Please bear with us whilst we verify your account! This usually takes up to 48hrs. 
                    Check back soon and try logging in with your email and password.
                </p>
                <p class="text-xs text-slate-400">Questions? Contact assurance@humbersidescouts.org.uk</p>
                <button onclick="location.reload()" class="mt-8 scout-gradient text-white px-8 py-3 rounded-full font-black uppercase text-xs">Return to Login</button>
            </div>`;
    } catch (e) { alert(e.message); }
};

window.handleLogin = async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try {
        const userCred = await signInWithEmailAndPassword(auth, email, pass);
        const userSnap = await getDoc(doc(db, "users", userCred.user.uid));
        
        if (!userSnap.exists() || !userSnap.data().isVerified) {
            alert("Verification Pending. Please allow up to 48hrs.");
            await signOut(auth);
            return;
        }

        profileData = userSnap.data();
        const recordSnap = await getDoc(doc(db, "project_focus_records", userCred.user.uid));
        userProgress = recordSnap.exists() ? recordSnap.data().responses : {};
        
        document.getElementById('auth-ui').classList.add('hidden');
        document.getElementById('audit-ui').classList.remove('hidden');
        document.getElementById('logout-btn').classList.remove('hidden');
        renderStep();
    } catch (e) { alert(e.message); }
};

window.saveField = async (id, value) => {
    userProgress[id] = { status: value, time: new Date().toISOString() };
    await setDoc(doc(db, "project_focus_records", auth.currentUser.uid), {
        email: profileData.email, // Ensure email is logged in the audit record too
        responses: userProgress,
        userDetails: profileData,
        lastUpdated: new Date().toISOString()
    }, { merge: true });
    renderStep();
};

window.changeSection = (dir) => { currentStep += dir; renderStep(); window.scrollTo(0,0); };
window.handleLogout = () => { auth.signOut(); location.reload(); };
window.finalSubmit = () => { alert("Audit Saved."); handleLogout(); };
