import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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

let allAuditData = [];
let allUserProfiles = [];

window.handleAdminLogin = async () => {
    const email = document.getElementById('admin-email').value;
    const pass = document.getElementById('admin-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) { alert("Login Denied."); }
};

onAuthStateChanged(auth, (user) => {
    if (user && user.email === 'tom.harrison@humbersidescouts.org.uk') {
        document.getElementById('admin-auth-ui').classList.add('hidden');
        document.getElementById('dashboard-ui').classList.remove('hidden');
        document.getElementById('admin-nav').classList.remove('hidden');
        loadAdminData();
    }
});

async function loadAdminData() {
    const [auditSnap, userSnap] = await Promise.all([
        getDocs(collection(db, "project_focus_records")),
        getDocs(collection(db, "users"))
    ]);
    
    allAuditData = auditSnap.docs.map(d => ({uid: d.id, ...d.data()}));
    allUserProfiles = userSnap.docs.map(d => ({uid: d.id, ...d.data()}));

    renderGrid();
    renderUserList();
}

window.showDistrictDetails = (district) => {
    const auditsInDistrict = allAuditData.filter(audit => {
        const profile = allUserProfiles.find(u => u.uid === audit.uid);
        return profile && profile.district === district;
    });

    const tbody = document.getElementById('response-table-body');
    tbody.innerHTML = auditsInDistrict.map(a => {
        const profile = allUserProfiles.find(u => u.uid === a.uid) || {};
        
        // EMAIL PULL: Checks multiple sources for redundancy
        const displayEmail = profile.email || a.email || profile.username || "Email Pending Sync";

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-10 align-top border-r w-1/3">
                    <div class="font-black text-[#003945] text-2xl uppercase italic tracking-tighter mb-2 leading-none">${profile.group || 'New Unit'}</div>
                    <div class="text-[11px] font-black text-[#7413dc] bg-purple-50 px-3 py-1 rounded-full inline-block uppercase tracking-widest mb-8 border border-purple-100">${profile.section || 'TBC'}</div>
                    <div class="pt-6 border-t border-slate-100">
                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 underline decoration-teal-500">${displayEmail}</span>
                        <div class="text-xs font-black text-slate-800 uppercase tracking-tight">${profile.name || 'Anonymous'}</div>
                    </div>
                </td>
                <td class="p-10 align-top">
                    </td>
            </tr>`;
    }).join('');
};

window.renderUserList = () => {
    const tbody = document.getElementById('user-table-body');
    const pending = allUserProfiles.filter(u => !u.isVerified);
    
    tbody.innerHTML = pending.length ? pending.map(u => `
        <tr class="hover:bg-slate-50 transition-all">
            <td class="p-6">
                <div class="font-bold text-[#003945] mb-1 underline decoration-[#ffe627]">${u.email || u.username || 'Email Missing'}</div>
                <div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">${new Date(u.createdAt).toLocaleDateString()}</div>
            </td>
            <td class="p-6">
                <div class="text-[10px] font-black uppercase text-slate-400 leading-tight mb-1">${u.district}</div>
                <div class="text-sm font-black text-slate-700 uppercase">${u.group} - ${u.section}</div>
            </td>
            <td class="p-6 text-right">
                <button onclick="verifyUser('${u.uid}')" class="scout-gradient text-white text-[10px] font-black uppercase px-6 py-2 rounded-full shadow-lg">Approve Access</button>
            </td>
        </tr>`).join('') : `<tr><td colspan="3" class="p-20 text-center text-slate-300 italic font-bold">Queue clear.</td></tr>`;
};

window.verifyUser = async (uid) => {
    await updateDoc(doc(db, "users", uid), { isVerified: true });
    alert("Approved.");
    await loadAdminData();
};
