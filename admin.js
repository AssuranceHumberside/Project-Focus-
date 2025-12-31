import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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
    "q_dbs": "DBS & Welcome Conversations", "q_training": "Mandatory Training", "q_firstaid": "First Aid Certificate",
    "q_yl": "Young Leader Induction", "q_yellow": "Yellow Card Access", "q_adult_ratio": "Adult Ratios",
    "q_helper_dbs": "Parent Helper DBS", "q_risk": "Written Risk Assessments", "q_approval": "Activity Approvals",
    "q14": "InTouch Process", "q_nightsaway": "Nights Away Permits", "q_permits": "Activity Permits",
    "q_gdpr": "Data Protection/GDPR", "q_inclusion": "Inclusion Adjustments", "q37": "Registers & Headcounts",
    "q16": "Medical Details Access", "q33": "Emergency Plan Knowledge", "q31": "First Aid Kit Access",
    "q42": "Accident Reporting", "q_supervision": "Supervision Plans", "q_intouch_test": "InTouch System Test",
    "q20": "Hazard Reduction", "q18": "Equipment Storage", "q25": "Fall Hazard Mitigation",
    "q22": "Overhead Hazards", "q30": "Equipment Inspections", "q_fire": "Fire Evacuation Plan",
    "q_hygiene": "Hygiene Facilities", "q27": "Age-Appropriate Activities", "q28": "Rule Briefings",
    "q_dynamic": "Dynamic Risk Assessment", "q36": "Leader in Charge Identity", "q39": "Delegated Oversight",
    "q43": "Safety Reviews", "q49": "Venue Safety Inspections"
};

onAuthStateChanged(auth, async (user) => {
    if (user && user.email === 'tom.harrison@humbersidescouts.org.uk') {
        document.getElementById('admin-auth-ui').classList.add('hidden');
        document.getElementById('dashboard-ui').classList.remove('hidden');
        document.getElementById('admin-nav').classList.remove('hidden');
        await loadAdminData();
    }
});

window.handleAdminLogin = async () => {
    const email = document.getElementById('admin-email').value.trim();
    const pass = document.getElementById('admin-password').value;
    try { await signInWithEmailAndPassword(auth, email, pass); } catch (e) { alert("Login Error: " + e.message); }
};

async function loadAdminData() {
    const [auditSnap, userSnap] = await Promise.all([
        getDocs(collection(db, "project_focus_records")),
        getDocs(collection(db, "users"))
    ]);
    allAuditData = auditSnap.docs.map(d => ({uid: d.id, ...d.data()}));
    allUserProfiles = userSnap.docs.map(d => ({uid: d.id, ...d.data()}));
    renderGrid(); renderUserList();
}

function csvSafe(v) {
    const s = (v ?? "").toString();
    const neutralised = /^[=+\-@]/.test(s) ? "'" + s : s;
    return `"${neutralised.replace(/"/g, '""')}"`;
}

window.exportToCSV = () => {
    let csv = "data:text/csv;charset=utf-8,District,Group,Section,Auditor,Email,Question,Status,Action,Deadline\r\n";
    allAuditData.forEach(audit => {
        const p = allUserProfiles.find(u => u.uid === audit.uid) || audit.userDetails || {};
        Object.entries(audit.responses || {}).forEach(([qId, val]) => {
            csv += [
                csvSafe(p.district), csvSafe(p.group), csvSafe(p.section),
                csvSafe(p.name), csvSafe(p.email), csvSafe(questionMap[qId] || qId),
                csvSafe(val?.status), csvSafe(val?.explanation), csvSafe(val?.deadline)
            ].join(",") + "\r\n";
        });
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `Project_Focus_Export_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link); link.click(); link.remove();
};

window.showDistrictDetails = (district) => {
    const audits = allAuditData.filter(a => {
        const profile = allUserProfiles.find(u => u.uid === a.uid) || a.userDetails || {};
        return profile.district === district;
    });
    document.getElementById('selected-district-name').innerText = district;
    document.getElementById('response-view').classList.remove('hidden');
    const tbody = document.getElementById('response-table-body');
    tbody.innerHTML = audits.map(a => {
        const profile = allUserProfiles.find(u => u.uid === a.uid) || a.userDetails || {};
        let issuesHtml = [];
        for (const [id, val] of Object.entries(a.responses || {})) {
            if (val.status && val.status !== "Yes") {
                issuesHtml.push(`
                    <div class="mb-4 p-5 bg-red-50 rounded-[1.5rem] border-l-4 border-red-500 shadow-sm">
                        <div class="text-[11px] font-black text-slate-800 uppercase mb-2">${questionMap[id] || id}</div>
                        <div class="text-[11px] text-slate-600 italic bg-white p-3 rounded-xl border mb-2">${val.explanation || 'No Comment'}</div>
                        <div class="flex gap-2"><span class="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded uppercase">${val.status}</span><span class="text-[8px] bg-slate-800 text-white px-2 py-0.5 rounded uppercase">${val.deadline}</span></div>
                    </div>`);
            }
        }
        return `
            <tr class="hover:bg-slate-50 border-b last:border-0">
                <td class="p-10 align-top border-r w-1/3">
                    <div class="font-black text-[#003945] text-2xl uppercase italic leading-none mb-2">${profile.group || 'N/A'}</div>
                    <div class="text-[11px] font-black text-[#7413dc] bg-purple-50 px-3 py-1 rounded-full inline-block uppercase tracking-widest mb-8 border border-purple-100">${profile.section || 'N/A'}</div>
                    <div class="pt-6 border-t border-slate-100">
                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block underline decoration-teal-500">${profile.email || a.email || 'Email Missing'}</span>
                        <div class="text-xs font-black text-slate-800 uppercase tracking-tight">${profile.name || 'Anonymous'}</div>
                    </div>
                </td>
                <td class="p-10 align-top">${issuesHtml.length > 0 ? issuesHtml.join('') : '<div class="text-emerald-600 font-black uppercase text-xs tracking-widest italic flex items-center gap-2">✓ Fully Assured</div>'}</td>
            </tr>`;
    }).join('');
};

window.renderGrid = () => {
    const districts = ["Beverley and Hornsea", "Blacktoft Beacon", "City of Hull", "County Section", "Grimsby and Cleethorpes", "North Lincolnshire", "Pocklington", "South Holderness", "Wolds and Coast"];
    const grid = document.getElementById('district-grid');
    grid.innerHTML = districts.map(district => {
        const districtAudits = allAuditData.filter(a => {
            const profile = allUserProfiles.find(u => u.uid === a.uid) || a.userDetails || {};
            return profile.district === district;
        });
        const redFlags = districtAudits.filter(a => Object.values(a.responses || {}).some(r => r.status && r.status !== "Yes")).length;
        return `
            <div onclick="showDistrictDetails('${district}')" class="cursor-pointer bg-white p-8 rounded-[2rem] shadow-xl border-b-8 transition-all hover:scale-[1.03] ${redFlags > 0 ? 'border-red-500' : 'border-emerald-500'}">
                <h3 class="font-black text-xl text-[#003945] uppercase italic mb-1">${district}</h3>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${districtAudits.length} Audits</p>
                <div class="mt-6 flex justify-between items-end"><span class="text-2xl font-black ${redFlags > 0 ? 'text-red-600' : 'text-emerald-600'}">${redFlags}</span></div>
            </div>`;
    }).join('');
};

window.renderUserList = () => {
    const tbody = document.getElementById('user-table-body');
    const pending = allUserProfiles.filter(u => !u.isVerified);
    tbody.innerHTML = pending.length ? pending.map(u => `
        <tr class="hover:bg-slate-50">
            <td class="p-6 font-bold text-[#003945] underline decoration-yellow-400">${u.email || "Missing Email"}</td>
            <td class="p-6 text-sm font-black text-slate-700 uppercase">${u.group} - ${u.section}</td>
            <td class="p-6 text-right"><button onclick="verifyUser('${u.uid}')" class="scout-gradient text-white text-[10px] font-black uppercase px-6 py-2 rounded-full shadow-lg">Approve</button></td>
        </tr>`).join('') : `<tr><td colspan="3" class="p-20 text-center text-slate-300 italic font-bold">No pending verification requests.</td></tr>`;
};

window.verifyUser = async (uid) => { await updateDoc(doc(db, "users", uid), { isVerified: true }); alert("Approved!"); await loadAdminData(); };
window.switchTab = (tab) => { 
    document.getElementById('tab-audits').classList.toggle('hidden', tab !== 'audits'); 
    document.getElementById('tab-users').classList.toggle('hidden', tab !== 'users'); 
};
window.closeDetails = () => document.getElementById('response-view').classList.add('hidden');
window.handleAdminLogout = () => { signOut(auth); location.reload(); };
