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

const questionMap = {
    "q_dbs": "Are all DBS and Welcome Conversations complete for the team?",
    "q_risk": "Are written risk assessments shared for every activity?",
    "q_training": "Is all mandatory training (Safety/Safeguarding) up to date?",
    "q12": "Is there a clear supervision and ratio plan for all sessions?",
    "q37": "Are accurate headcounts and registers maintained live?",
    "q31": "Is a first-aid kit always accessible to all adults?",
    "q20": "Are tripping/slipping hazards actively identified and reduced?",
    "q18": "Is equipment stored safely when not in use?",
    "q30": "Is equipment regularly inspected for safe working order?",
    "q_dynamic": "Do you actively 'check and challenge' safety during meetings?",
    "q36": "Is a specific 'Leader in Charge' clearly identified for every session?",
    "q43": "Is safety a standard talking point in post-activity reviews?"
};

window.handleAdminLogin = async () => {
    const email = document.getElementById('admin-email').value;
    const pass = document.getElementById('admin-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) { alert("Login Failed"); }
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
    try {
        const [auditSnap, userSnap] = await Promise.all([
            getDocs(collection(db, "project_focus_records")),
            getDocs(collection(db, "users"))
        ]);
        
        // Map data including the document ID (UID)
        allAuditData = auditSnap.docs.map(d => ({uid: d.id, ...d.data()}));
        allUserProfiles = userSnap.docs.map(d => ({uid: d.id, ...d.data()}));

        renderGrid();
        renderUserList();
    } catch (err) { console.error(err); }
}

function renderGrid() {
    const districts = ["Beverley and Hornsea", "Blacktoft Beacon", "City of Hull", "County Section", "Grimsby and Cleethorpes", "North Lincolnshire", "Pocklington", "South Holderness", "Wolds and Coast"];
    const grid = document.getElementById('district-grid');
    
    grid.innerHTML = districts.map(district => {
        const districtAudits = allAuditData.filter(audit => {
            const profile = allUserProfiles.find(u => u.uid === audit.uid);
            return profile && profile.district === district;
        });

        const redFlags = districtAudits.filter(a => 
            Object.values(a.responses || {}).some(r => r.status === "No" || r.status === "Partially")
        ).length;

        return `
            <div onclick="showDistrictDetails('${district}')" class="cursor-pointer bg-white p-8 rounded-[2rem] shadow-xl border-b-8 transition-all hover:scale-[1.03] ${redFlags > 0 ? 'border-red-500' : 'border-emerald-500'}">
                <h3 class="font-black text-xl text-[#003945] uppercase italic tracking-tighter mb-1">${district}</h3>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${districtAudits.length} Units Audited</p>
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
        // CROSS-REFERENCE FIX: Get the email from the user profile
        const profile = allUserProfiles.find(u => u.uid === a.uid) || {};
        let issues = [];
        const res = a.responses || {};
        
        for (const [id, val] of Object.entries(res)) {
            if (val.status !== "Yes") {
                issues.push(`
                    <div class="mb-4 p-5 bg-red-50 rounded-[1.5rem] border-l-4 border-red-500 shadow-sm">
                        <div class="text-[11px] font-black text-slate-800 uppercase mb-2 tracking-tight">${questionMap[id] || id}</div>
                        <div class="text-[11px] text-slate-600 italic bg-white p-3 rounded-xl border border-red-100 mb-3">${val.explanation || 'No details provided.'}</div>
                        <div class="flex gap-2">
                             <span class="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded font-black uppercase">${val.status}</span>
                             <span class="text-[8px] bg-slate-800 text-white px-2 py-0.5 rounded font-black uppercase">By: ${val.deadline || 'TBC'}</span>
                        </div>
                    </div>`);
            }
        }

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-10 align-top border-r w-1/3">
                    <div class="font-black text-[#003945] text-2xl uppercase leading-none mb-2 tracking-tighter italic">${profile.group || 'Unknown Group'}</div>
                    <div class="text-[11px] font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-full inline-block uppercase tracking-widest mb-8 border border-purple-100">${profile.section || 'Unknown Section'}</div>
                    <div class="pt-6 border-t border-slate-100">
                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email Address:</span>
                        <div class="text-xs font-black text-teal-700 mb-3 break-all">${profile.email || a.email || 'Email Not Found'}</div>
                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Auditor:</span>
                        <div class="text-xs font-black text-slate-800 uppercase tracking-tight">${profile.name || 'Anonymous'}</div>
                    </div>
                </td>
                <td class="p-10 align-top">${issues.length > 0 ? issues.join('') : '<div class="text-emerald-600 font-black uppercase text-xs tracking-[0.2em] italic flex items-center gap-2">✓ Fully Assured & Compliant</div>'}</td>
            </tr>`;
    }).join('');
    window.scrollTo({ top: document.getElementById('response-view').offsetTop - 20, behavior: 'smooth' });
};

window.renderUserList = () => {
    const tbody = document.getElementById('user-table-body');
    const pending = allUserProfiles.filter(u => !u.isVerified);
    
    tbody.innerHTML = pending.length ? pending.map(u => `
        <tr class="hover:bg-slate-50 transition-all">
            <td class="p-6">
                <div class="font-black text-[#003945] mb-1 underline decoration-[#ffe627]">${u.email || 'Missing Email'}</div>
                <div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">${new Date(u.createdAt).toLocaleDateString()}</div>
            </td>
            <td class="p-6">
                <div class="text-[10px] font-black uppercase text-slate-400 leading-tight mb-1">${u.district}</div>
                <div class="text-sm font-black text-slate-700 uppercase">${u.group} - ${u.section}</div>
            </td>
            <td class="p-6 text-right">
                <button onclick="verifyUser('${u.uid}')" class="scout-gradient text-white text-[10px] font-black uppercase px-6 py-2 rounded-full shadow-lg">Approve Access</button>
            </td>
        </tr>`).join('') : `<tr><td colspan="3" class="p-20 text-center text-slate-300 italic font-bold">The verification queue is clear.</td></tr>`;
};

window.verifyUser = async (uid) => {
    try {
        await updateDoc(doc(db, "users", uid), { isVerified: true });
        alert("Verification successful.");
        await loadAdminData();
    } catch (e) { alert("Error approving user."); }
};

window.switchTab = (tab) => {
    document.getElementById('tab-audits').classList.toggle('hidden', tab !== 'audits');
    document.getElementById('tab-users').classList.toggle('hidden', tab !== 'users');
};

window.closeDetails = () => document.getElementById('response-view').classList.add('hidden');
