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
    try { await signInWithEmailAndPassword(auth, email, pass); } catch (e) { alert("Login Failed"); }
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

function renderGrid() {
    const districts = ["Beverley and Hornsea", "Blacktoft Beacon", "City of Hull", "County Section", "Grimsby and Cleethorpes", "North Lincolnshire", "Pocklington", "South Holderness", "Wolds and Coast"];
    const grid = document.getElementById('district-grid');
    grid.innerHTML = districts.map(district => {
        const districtAudits = allAuditData.filter(audit => {
            const profile = allUserProfiles.find(u => u.uid === audit.uid);
            return profile && profile.district === district;
        });
        const redFlags = districtAudits.filter(a => Object.values(a.responses || {}).some(r => r.status !== "Yes")).length;
        return `
            <div onclick="showDistrictDetails('${district}')" class="cursor-pointer bg-white p-8 rounded-[2rem] shadow-xl border-b-8 transition-all hover:scale-[1.03] ${redFlags > 0 ? 'border-red-500' : 'border-emerald-500'}">
                <h3 class="font-black text-xl text-[#003945] uppercase italic tracking-tighter mb-1">${district}</h3>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${districtAudits.length} Audits</p>
                <div class="mt-6 flex justify-between items-end">
                    <span class="text-2xl font-black ${redFlags > 0 ? 'text-red-600' : 'text-emerald-600'}">${redFlags}</span>
                    <span class="text-[9px] font-black uppercase text-slate-400 pb-1 italic">Action Needed</span>
                </div>
            </div>`;
    }).join('');
}

window.showDistrictDetails = (district) => {
    const auditsInDistrict = allAuditData.filter(audit => {
        const profile = allUserProfiles.find(u => u.uid === audit.uid);
        return profile && profile.district === district;
    });
    document.getElementById('selected-district-name').innerText = district;
    document.getElementById('response-view').classList.remove('hidden');
    const tbody = document.getElementById('response-table-body');
    tbody.innerHTML = auditsInDistrict.map(a => {
        const profile = allUserProfiles.find(u => u.uid === a.uid) || {};
        const email = profile.email || a.email || "Email Not Found";
        return `
            <tr>
                <td class="p-10 align-top border-r w-1/3">
                    <div class="font-black text-[#003945] text-2xl uppercase italic tracking-tighter leading-none mb-2">${profile.group || 'N/A'}</div>
                    <div class="text-[11px] font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-full inline-block uppercase tracking-widest mb-8 border border-purple-100">${profile.section || 'N/A'}</div>
                    <div class="pt-6 border-t border-slate-100">
                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 underline decoration-teal-500">${email}</span>
                        <div class="text-xs font-black text-slate-800 uppercase tracking-tight">${profile.name || 'Anonymous'}</div>
                    </div>
                </td>
                <td class="p-10 align-top">...issues render here...</td>
            </tr>`;
    }).join('');
};

window.renderUserList = () => {
    const tbody = document.getElementById('user-table-body');
    const pending = allUserProfiles.filter(u => !u.isVerified);
    tbody.innerHTML = pending.map(u => `
        <tr class="hover:bg-slate-50 transition-all">
            <td class="p-6 font-bold text-[#003945] underline decoration-yellow-400">${u.email}</td>
            <td class="p-6 text-sm font-black text-slate-700 uppercase">${u.group} - ${u.section}</td>
            <td class="p-6 text-right"><button onclick="verifyUser('${u.uid}')" class="scout-gradient text-white text-[10px] font-black uppercase px-6 py-2 rounded-full shadow-lg">Approve</button></td>
        </tr>`).join('');
};

window.verifyUser = async (uid) => {
    await updateDoc(doc(db, "users", uid), { isVerified: true });
    alert("Approved!"); loadAdminData();
};

window.switchTab = (tab) => {
    document.getElementById('tab-audits').classList.toggle('hidden', tab !== 'audits');
    document.getElementById('tab-users').classList.toggle('hidden', tab !== 'users');
};
window.closeDetails = () => document.getElementById('response-view').classList.add('hidden');
