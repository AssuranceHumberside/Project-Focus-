import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

let allData = [];
let allUsers = [];

window.handleAdminLogin = async () => {
    const email = document.getElementById('admin-email').value;
    const pass = document.getElementById('admin-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        document.getElementById('admin-auth-ui').classList.add('hidden');
        document.getElementById('dashboard-ui').classList.remove('hidden');
        document.getElementById('admin-nav').classList.remove('hidden');
        
        // CRITICAL: Load data immediately after login
        await loadAdminData();
    } catch (e) { alert("Login Denied. Contact assurance@humbersidescouts.org.uk"); }
};

async function loadAdminData() {
    try {
        // Fetch All Collections
        const [auditSnap, userSnap] = await Promise.all([
            getDocs(collection(db, "project_focus_records")),
            getDocs(collection(db, "users"))
        ]);
        
        allData = auditSnap.docs.map(d => ({id: d.id, ...d.data()}));
        allUsers = userSnap.docs.map(d => ({id: d.id, ...d.data()}));

        // Trigger UI Renders
        renderGrid();
        renderUserList();
    } catch (err) {
        console.error("Data Load Error:", err);
        alert("Unable to pull records. Check database rules.");
    }
}

// ... Rest of your Grid and User Table rendering logic ...
