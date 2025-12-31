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

// Automatic Admin Login (Replace with your login flow as needed)
async function loadAdminData() {
    const auditSnap = await getDocs(collection(db, "project_focus_records"));
    allData = auditSnap.docs.map(d => ({id: d.id, ...d.data()}));
    
    const userSnap = await getDocs(collection(db, "users"));
    allUsers = userSnap.docs.map(d => ({id: d.id, ...d.data()}));
    
    renderGrid();
    renderUserList();
}

window.renderUserList = () => {
    const tbody = document.getElementById('user-table-body');
    const pending = allUsers.filter(u => !u.isVerified);
    tbody.innerHTML = pending.length ? pending.map(u => `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-6">
                <div class="font-black text-teal-900 uppercase leading-none mb-1">${u.group}</div>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${u.section} (${u.district})</div>
            </td>
            <td class="p-6 font-bold text-slate-700 uppercase text-xs">${u.name}</td>
            <td class="p-6 text-right">
                <button onclick="verifyUser('${u.id}')" class="scout-gradient text-white text-[10px] font-black uppercase px-6 py-2 rounded-full shadow-lg">Verify Auditor</button>
            </td>
        </tr>`).join('') : `<tr><td colspan="3" class="p-10 text-center text-slate-300 italic">No pending verifications.</td></tr>`;
};

window.verifyUser = async (uid) => {
    try {
        await updateDoc(doc(db, "users", uid), { isVerified: true });
        alert("User Verified.");
        loadAdminData();
    } catch (e) { alert("Error."); }
};

window.switchTab = (tab) => {
    document.getElementById('tab-audits').classList.toggle('hidden', tab !== 'audits');
    document.getElementById('tab-users').classList.toggle('hidden', tab !== 'users');
};

window.showDistrictDetails = (district) => {
    const districtAudits = allData.filter(a => a.userDetails?.district === district);
    document.getElementById('selected-district-name').innerText = district;
    document.getElementById('response-view').classList.remove('hidden');
    
    const tbody = document.getElementById('response-table-body');
    tbody.innerHTML = districtAudits.map(a => {
        let issues = [];
        const res = a.responses || {};
        const history = a.history || {};
        
        for (const [id, val] of Object.entries(res)) {
            const logs = (history[id] || []).map(log => `
                <div class="text-[9px] text-slate-400 border-l-2 pl-2 border-slate-200 mt-1 uppercase font-bold tracking-widest">
                    Fixed: ${log.from} → ${log.to} | ${new Date(log.time).toLocaleDateString()}
                </div>`).join('');

            if (val.status !== "Yes") {
                issues.push(`
                    <div class="mb-4 p-5 bg-red-50 rounded-[1.2rem] border-l-4 border-red-500 shadow-sm">
                        <div class="text-xs font-black text-slate-800 uppercase mb-2 leading-tight">${id.replace('q_', '').replace('_', ' ')}</div>
                        <div class="text-[11px] text-slate-600 italic bg-white p-3 rounded-xl border border-red-100">${val.explanation || 'No Comment'}</div>
                        <div class="mt-3 flex gap-2">
                             <span class="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded font-black uppercase">${val.status}</span>
                             <span class="text-[9px] bg-slate-800 text-white px-2 py-0.5 rounded font-black uppercase">TARGET: ${val.deadline || 'TBC'}</span>
                        </div>
                        ${logs}
                    </div>`);
            }
        }

        return `
            <tr class="hover:bg-slate-50">
                <td class="p-8 align-top border-r w-1/3">
                    <div class="font-black text-teal-900 text-lg uppercase leading-none mb-1">${a.userDetails?.group || 'N/A'}</div>
                    <div class="text-[11px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded inline-block uppercase tracking-widest mb-6">${a.userDetails?.section || 'N/A'}</div>
                    <div class="pt-4 border-t border-slate-100">
                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Auditor</span>
                        <div class="text-xs font-black text-slate-800 uppercase">${a.userDetails?.name || 'Unknown'}</div>
                    </div>
                </td>
                <td class="p-8 align-top">${issues.length > 0 ? issues.join('') : '<div class="text-emerald-600 font-bold italic uppercase text-xs tracking-widest">✓ All Requirements Met</div>'}</td>
            </tr>`;
    }).join('');
    window.scrollTo({ top: document.getElementById('response-view').offsetTop - 20, behavior: 'smooth' });
};

window.closeDetails = () => document.getElementById('response-view').classList.add('hidden');
loadAdminData();
