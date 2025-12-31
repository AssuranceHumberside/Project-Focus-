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
    "q_dbs": "Are all DBS, AAC, and Welcome Conversations complete for the team?",
    "q_training": "Has every leader completed mandatory safety and safeguarding training?",
    "q_firstaid": "Is there at least one adult with a valid First Aid certificate present?",
    "q_yl": "Do Young Leaders receive a proper induction and training?",
    "q_yellow": "Does every adult volunteer have access to the Yellow Card?",
    "q_adult_ratio": "Are adult-to-young-person ratios always met or exceeded?",
    "q_helper_dbs": "Do all regular parent helpers have a valid DBS check?",
    "q_risk": "Is a written risk assessment produced and shared for every activity?",
    "q_approval": "Are activities held away from your venue approved by the Lead Volunteer?",
    "q14": "Is a robust InTouch process active for every meeting and trip?",
    "q_nightsaway": "Is a Nights Away Permit holder always in charge of overnight events?",
    "q_permits": "Are Adventurous Activity Permits checked and valid?",
    "q_gdpr": "Is personal data stored securely and disposed of correctly?",
    "q_inclusion": "Are reasonable adjustments made to ensure inclusion?",
    "q37": "Does the Leader in Charge maintain an accurate register?",
    "q16": "Are medical details for everyone immediately accessible during activities?",
    "q33": "Do you have a clear emergency plan known to all adults?",
    "q31": "Is a fully-stocked first-aid kit easily accessible to all leaders?",
    "q42": "Does every adult understand how to record and report accidents?",
    "q_supervision": "Is there effective supervision during all activities?",
    "q_intouch_test": "Do you periodically test your InTouch system?",
    "q20": "Have practical steps been taken to reduce tripping or slipping hazards?",
    "q18": "Are chairs, tables, and equipment stored safely when not in use?",
    "q25": "Has the potential for falls onto hard surfaces been minimised?",
    "q22": "Do you check for overhead hazards and guard lights appropriately?",
    "q30": "Is all equipment regularly inspected for safe working order?",
    "q_fire": "Are you aware of fire exits and the evacuation plan?",
    "q_hygiene": "Are handwashing facilities or sanitiser always available?",
    "q27": "Are all games and activities suitable for the age and ability?",
    "q28": "Are rules clearly briefed and understood before play begins?",
    "q_dynamic": "Do you actively 'check and challenge' safety during meetings?",
    "q36": "Is a specific 'Leader in Charge' clearly identified for every session?",
    "q39": "Does the Leader in Charge assign specific oversight responsibilities?",
    "q43": "Is safety a standard talking point in planning and reviews?",
    "q47": "Is the leadership team supported to improve safety knowledge?",
    "q49": "Is all safety-specific equipment at the venue inspected regularly?"
};

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
    try {
        const [auditSnap, userSnap] = await Promise.all([
            getDocs(collection(db, "project_focus_records")),
            getDocs(collection(db, "users"))
        ]);
        allAuditData = auditSnap.docs.map(d => ({uid: d.id, ...d.data()}));
        allUserProfiles = userSnap.docs.map(d => ({uid: d.id, ...d.data()}));
        renderGrid();
        renderUserList();
    } catch (err) { console.error("Sync Error:", err); }
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
            <div onclick="showDistrictDetails('${district}')" class="cursor-pointer bg-white p-8 rounded-[2rem] shadow-xl border-b-8 transition-all hover:scale-[1.03] ${redFlags > 0 ? 'border-red-500 shadow-red-100' : 'border-emerald-500 shadow-emerald-50'}">
                <h3 class="font-black text-xl text-[#003945] uppercase italic tracking-tighter mb-1">${district}</h3>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${districtAudits.length} Audits</p>
                <div class="mt-6 flex justify-between items-end">
                    <span class="text-2xl font-black ${redFlags > 0 ? 'text-red-600' : 'text-emerald-600'}">${redFlags}</span>
                    <span class="text-[9px] font-black uppercase text-slate-400 pb-1 italic text-[#003945]">Action Required</span>
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
        let issues = [];
        const res = a.responses || {};
        
        for (const [id, val] of Object.entries(res)) {
            if (val.status !== "Yes") {
                issues.push(`
                    <div class="mb-4 p-5 bg-red-50 rounded-[1.5rem] border-l-4 border-red-500 shadow-sm">
                        <div class="text-[11px] font-black text-slate-800 uppercase mb-2 tracking-tight">${questionMap[id] || id}</div>
                        <div class="text-[11px] text-slate-600 italic bg-white p-3 rounded-xl border border-red-100 mb-3">${val.explanation || 'No action plan provided.'}</div>
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
                    <div class="font-black text-[#003945] text-2xl uppercase italic tracking-tighter mb-2 leading-none">${profile.group || 'N/A'}</div>
                    <div class="text-[11px] font-black text-[#7413dc] bg-purple-50 px-3 py-1 rounded-full inline-block uppercase tracking-widest mb-8 border border-purple-100">${profile.section || 'N/A'}</div>
                    <div class="pt-6 border-t border-slate-100 space-y-3">
                        <div>
                            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email / Contact</span>
                            <div class="text-xs font-black text-[#088486] underline decoration-yellow-400 break-all">${email}</div>
                        </div>
                        <div>
                            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Lead Auditor</span>
                            <div class="text-xs font-black text-slate-800 uppercase tracking-tight">${profile.name || 'Anonymous'}</div>
                        </div>
                    </div>
                </td>
                <td class="p-10 align-top">${issues.length > 0 ? issues.join('') : '<div class="text-emerald-600 font-black uppercase text-xs tracking-widest italic flex items-center gap-2">✓ Fully Assured</div>'}</td>
            </tr>`;
    }).join('');
    window.scrollTo({ top: document.getElementById('response-view').offsetTop - 20, behavior: 'smooth' });
};

window.renderUserList = () => {
    const tbody = document.getElementById('user-table-body');
    const pending = allUserProfiles.filter(u => !u.isVerified);
    tbody.innerHTML = pending.map(u => `
        <tr class="hover:bg-slate-50 transition-all">
            <td class="p-6 font-bold text-[#003945] underline decoration-yellow-400">${u.email}</td>
            <td class="p-6 text-sm font-black text-slate-700 uppercase">${u.group} - ${u.section}</td>
            <td class="p-6 text-right"><button onclick="verifyUser('${u.uid}')" class="scout-gradient text-white text-[10px] font-black uppercase px-6 py-2 rounded-full shadow-lg">Verify Auditor</button></td>
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
