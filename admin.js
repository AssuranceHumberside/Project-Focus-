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
        loadAdminData();
    } catch (e) { alert("Login Error: " + e.message); }
};

async function loadAdminData() {
    const auditSnap = await getDocs(collection(db, "project_focus_records"));
    const userSnap = await getDocs(collection(db, "users"));
    
    allData = auditSnap.docs.map(d => ({id: d.id, ...d.data()}));
    allUsers = userSnap.docs.map(d => ({id: d.id, ...d.data()}));

    renderGrid();
    renderUserList();
}

window.renderUserList = () => {
    const tbody = document.getElementById('user-table-body');
    const pending = allUsers.filter(u => !u.isVerified);
    
    tbody.innerHTML = pending.length ? pending.map(u => `
        <tr class="hover:bg-slate-50 transition-all">
            <td class="p-6 font-bold text-teal-900">${u.email}</td>
            <td class="p-6">
                <div class="text-[10px] font-black uppercase text-slate-400 leading-tight mb-1">${u.district}</div>
                <div class="text-sm font-black text-slate-700 uppercase">${u.group} - ${u.section}</div>
            </td>
            <td class="p-6 text-right">
                <button onclick="verifyUser('${u.id}')" class="scout-gradient text-white text-[10px] font-black uppercase px-6 py-2 rounded-full shadow-lg hover:shadow-teal-900/20 transition-all">Approve Access</button>
            </td>
        </tr>`).join('') : `<tr><td colspan="3" class="p-20 text-center text-slate-300 italic font-bold">Verification queue is empty.</td></tr>`;
};

window.verifyUser = async (uid) => {
    try {
        await updateDoc(doc(db, "users", uid), { isVerified: true });
        alert("Verification Complete.");
        loadAdminData();
    } catch (e) { alert("Error updating user."); }
};

window.switchTab = (tab) => {
    document.getElementById('tab-audits').classList.toggle('hidden', tab !== 'audits');
    document.getElementById('tab-users').classList.toggle('hidden', tab !== 'users');
};

function renderGrid() {
    const districts = ["Beverley and Hornsea", "Blacktoft Beacon", "City of Hull", "County Section", "Grimsby and Cleethorpes", "North Lincolnshire", "Pocklington", "South Holderness", "Wolds and Coast"];
    const grid = document.getElementById('district-grid');
    
    grid.innerHTML = districts.map(district => {
        const districtAudits = allData.filter(a => a.userDetails?.district === district);
        const redFlags = districtAudits.filter(a => 
            Object.values(a.responses || {}).some(r => r.status === "No" || r.status === "Partially")
        ).length;

        return `
            <div onclick="showDistrictDetails('${district}')" class="cursor-pointer bg-white p-8 rounded-[2rem] shadow-xl border-b-8 transition-all hover:scale-[1.03] ${redFlags > 0 ? 'border-red-500 shadow-red-100' : 'border-emerald-500 shadow-emerald-50 shadow-emerald-100'}">
                <h3 class="font-black text-xl text-teal-900 uppercase italic tracking-tighter mb-1">${district}</h3>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${districtAudits.length} Units Audited</p>
                <div class="mt-6 flex justify-between items-end">
                    <span class="text-2xl font-black ${redFlags > 0 ? 'text-red-600' : 'text-emerald-600'}">${redFlags}</span>
                    <span class="text-[9px] font-black uppercase text-slate-400 pb-1">Unresolved Issues</span>
                </div>
            </div>`;
    }).join('');
}

window.showDistrictDetails = (district) => {
    const districtAudits = allData.filter(a => a.userDetails?.district === district);
    document.getElementById('selected-district-name').innerText = district;
    document.getElementById('response-view').classList.remove('hidden');
    
    const tbody = document.getElementById('response-table-body');
    tbody.innerHTML = districtAudits.map(a => {
        let issues = [];
        const res = a.responses || {};
        for (const [id, val] of Object.entries(res)) {
            if (val.status !== "Yes") {
                issues.push(`
                    <div class="mb-4 p-5 bg-red-50 rounded-[1.5rem] border-l-4 border-red-500 shadow-sm">
                        <div class="text-[11px] font-black text-slate-800 uppercase mb-2 tracking-tight line-clamp-2">${id.replace('q_', '').replace(/_/g, ' ')}</div>
                        <div class="text-[11px] text-slate-600 italic bg-white p-3 rounded-xl border border-red-100 mb-3">${val.explanation || 'No Comment Provided'}</div>
                        <div class="flex gap-2">
                             <span class="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded font-black uppercase">Status: ${val.status}</span>
                             <span class="text-[8px] bg-slate-800 text-white px-2 py-0.5 rounded font-black uppercase">Target: ${val.deadline || 'TBC'}</span>
                        </div>
                    </div>`);
            }
        }

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-10 align-top border-r w-1/3">
                    <div class="font-black text-teal-900 text-2xl uppercase leading-none mb-2 tracking-tighter italic">${a.userDetails?.group || 'N/A'}</div>
                    <div class="text-[11px] font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-full inline-block uppercase tracking-widest mb-8 border border-purple-100">${a.userDetails?.section || 'N/A'}</div>
                    <div class="pt-6 border-t border-slate-100">
                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Lead Auditor</span>
                        <div class="text-xs font-black text-slate-800 uppercase tracking-tight">${a.userDetails?.name || 'Unknown'}</div>
                    </div>
                </td>
                <td class="p-10 align-top">${issues.length > 0 ? issues.join('') : '<div class="text-emerald-600 font-black uppercase text-xs tracking-[0.2em] italic flex items-center gap-2">✓ Fully Assured & POR Compliant</div>'}</td>
            </tr>`;
    }).join('');
    window.scrollTo({ top: document.getElementById('response-view').offsetTop - 20, behavior: 'smooth' });
};

window.closeDetails = () => document.getElementById('response-view').classList.add('hidden');
