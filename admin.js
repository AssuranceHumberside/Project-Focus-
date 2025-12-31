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

window.handleAdminLogin = async () => {
    const email = document.getElementById('admin-email').value;
    const pass = document.getElementById('admin-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        document.getElementById('admin-auth-ui').classList.add('hidden');
        document.getElementById('dashboard-ui').classList.remove('hidden');
        document.getElementById('admin-nav').classList.remove('hidden');
        loadAdminData();
    } catch (e) { alert("Login Failed"); }
};

async function loadAdminData() {
    const auditSnap = await getDocs(collection(db, "project_focus_records"));
    const userSnap = await getDocs(collection(db, "users"));
    
    const allData = auditSnap.docs.map(d => ({id: d.id, ...d.data()}));
    const allUsers = userSnap.docs.map(d => ({id: d.id, ...d.data()}));

    // Render Logic for Users and Grid...
    renderUserList(allUsers);
    renderGrid(allData);
}

window.renderUserList = (users) => {
    const tbody = document.getElementById('user-table-body');
    const pending = users.filter(u => !u.isVerified);
    tbody.innerHTML = pending.map(u => `
        <tr class="p-6">
            <td class="p-6 font-black uppercase text-teal-900">${u.email} <br> <span class="text-[10px] text-slate-400">${u.group}</span></td>
            <td class="p-6 text-right"><button onclick="verifyUser('${u.id}')" class="scout-gradient text-white text-[10px] px-6 py-2 rounded-full font-black uppercase">Approve</button></td>
        </tr>`).join('');
};

window.verifyUser = async (uid) => {
    await updateDoc(doc(db, "users", uid), { isVerified: true });
    alert("Approved!");
    loadAdminData();
};

window.switchTab = (tab) => {
    document.getElementById('tab-audits').classList.toggle('hidden', tab !== 'audits');
    document.getElementById('tab-users').classList.toggle('hidden', tab !== 'users');
};
