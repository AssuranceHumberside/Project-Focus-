import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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

const questionMap = { /* ... 35-question map ... */ };

window.handleAdminLogin = async () => {
    const email = document.getElementById('admin-email').value.trim();
    const pass = document.getElementById('admin-password').value;
    try {
        const userCred = await signInWithEmailAndPassword(auth, email, pass);
        if (userCred.user.email === 'tom.harrison@humbersidescouts.org.uk') {
            document.getElementById('admin-auth-ui').classList.add('hidden');
            document.getElementById('dashboard-ui').classList.remove('hidden');
            document.getElementById('admin-nav').classList.remove('hidden');
            await loadAdminData();
        } else { alert("Unauthorized."); await signOut(auth); }
    } catch (e) { alert("Login Error: " + e.message); }
};

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
    const audits = allAuditData.filter(a => {
        const profile = allUserProfiles.find(u => u.uid === a.uid);
        return profile && profile.district === district;
    });
    document.getElementById('selected-district-name').innerText = district;
    document.getElementById('response-view').classList.remove('hidden');
    const tbody = document.getElementById('response-table-body');
    tbody.innerHTML = audits.map(a => {
        const profile = allUserProfiles.find(u => u.uid === a.uid) || {};
        let issuesHtml = [];
        for (const [id, val] of Object.entries(a.responses || {})) {
            if (val.status && val.status !== "Yes") {
                issuesHtml.push(`
                    <div class="mb-4 p-5 bg-red-50 rounded-[1.5rem] border-l-4 border-red-500 shadow-sm">
                        <div class="text-[11px] font-black text-slate-800 uppercase mb-2 tracking-tight">${id.replace(/_/g, ' ')}</div>
                        <div class="text-[11px] text-slate-600 italic bg-white p-3 rounded-xl border border-red-100 mb-2 font-medium">${val.explanation || 'No plan.'}</div>
                        <div class="flex gap-2">
                             <span class="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded font-black uppercase">${val.status}</span>
                             <span class="text-[8px] bg-slate-800 text-white px-2 py-0.5 rounded font-black uppercase">TARGET: ${val.deadline || 'TBC'}</span>
                        </div>
                    </div>`);
            }
        }
        return `
            <tr class="hover:bg-slate-50 transition-colors border-b last:border-0">
                <td class="p-10 align-top border-r w-1/3">
                    <div class="font-black text-[#003945] text-2xl uppercase italic tracking-tighter leading-none mb-2">${profile.group || 'N/A'}</div>
                    <div class="text-[11px] font-black text-[#7413dc] bg-purple-50 px-3 py-1 rounded-full inline-block uppercase tracking-widest mb-8 border border-purple-100">${profile.section || 'N/A'}</div>
                    <div class="pt-6 border-t border-slate-100 space-y-3">
                        <div>
                            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email</span>
                            <div class="text-xs font-black text-[#088486] underline decoration-yellow-400 break-all">${profile.email || a.email || 'Email Missing'}</div>
                        </div>
                    </div>
                </td>
                <td class="p-10 align-top">${issuesHtml.length > 0 ? issuesHtml.join('') : '<div class="text-emerald-600 font-black uppercase text-xs tracking-widest italic">✓ Fully Assured</div>'}</td>
            </tr>`;
    }).join('');
};

window.renderGrid = () => { /* Logic to build district grid as before */ };
window.renderUserList = () => { /* Logic to build access queue as before */ };
window.verifyUser = async (uid) => { /* Logic to approve user as before */ };
window.switchTab = (tab) => { document.getElementById('tab-audits').classList.toggle('hidden', tab !== 'audits'); document.getElementById('tab-users').classList.toggle('hidden', tab !== 'users'); };
window.closeDetails = () => document.getElementById('response-view').classList.add('hidden');
window.handleAdminLogout = () => { signOut(auth); location.reload(); };
