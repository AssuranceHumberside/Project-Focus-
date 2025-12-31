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

let allAuditData = [];
let allUserProfiles = [];

window.handleAdminLogin = async () => {
    const email = document.getElementById('admin-email').value;
    const pass = document.getElementById('admin-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        document.getElementById('admin-auth-ui').classList.add('hidden');
        document.getElementById('dashboard-ui').classList.remove('hidden');
        document.getElementById('admin-nav').classList.remove('hidden');
        await loadAdminData();
    } catch (e) { alert("SME Login Failed."); }
};

async function loadAdminData() {
    try {
        // Fetch both collections simultaneously
        const [auditSnap, userSnap] = await Promise.all([
            getDocs(collection(db, "project_focus_records")),
            getDocs(collection(db, "users"))
        ]);
        
        allAuditData = auditSnap.docs.map(d => ({uid: d.id, ...d.data()}));
        allUserProfiles = userSnap.docs.map(d => ({uid: d.id, ...d.data()}));

        renderGrid();
        renderUserList();
    } catch (err) { alert("Error connecting to database."); }
}

function renderGrid() {
    const districts = ["Beverley and Hornsea", "Blacktoft Beacon", "City of Hull", "County Section", "Grimsby and Cleethorpes", "North Lincolnshire", "Pocklington", "South Holderness", "Wolds and Coast"];
    const grid = document.getElementById('district-grid');
    
    grid.innerHTML = districts.map(district => {
        // Link audits to their user profiles to find the district
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
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${districtAudits.length} Active Audits</p>
                <div class="mt-6 flex justify-between items-end">
                    <span class="text-2xl font-black ${redFlags > 0 ? 'text-red-600' : 'text-emerald-600'}">${redFlags}</span>
                    <span class="text-[9px] font-black uppercase text-slate-400 pb-1">Issues Found</span>
                </div>
            </div>`;
    }).join('');
}

window.showDistrictDetails = (district) => {
    // Logic to filter allAuditData by looking up profiles in allUserProfiles
    const auditsInDistrict = allAuditData.filter(audit => {
        const profile = allUserProfiles.find(u => u.uid === audit.uid);
        return profile && profile.district === district;
    });

    document.getElementById('selected-district-name').innerText = district;
    document.getElementById('response-view').classList.remove('hidden');
    
    const tbody = document.getElementById('response-table-body');
    tbody.innerHTML = auditsInDistrict.map(a => {
        const profile = allUserProfiles.find(u => u.uid === a.uid) || {};
        // ... [Rest of row rendering logic using 'profile' for Name/Group/Section] ...
    }).join('');
};

window.renderUserList = () => {
    const tbody = document.getElementById('user-table-body');
    const pending = allUserProfiles.filter(u => !u.isVerified);
    
    tbody.innerHTML = pending.length ? pending.map(u => `
        <tr class="hover:bg-slate-50 transition-all">
            <td class="p-6 font-bold text-[#003945]">${u.email}</td>
            <td class="p-6">
                <div class="text-[10px] font-black uppercase text-slate-400 leading-tight mb-1">${u.district}</div>
                <div class="text-sm font-black text-slate-700 uppercase">${u.group} - ${u.section}</div>
            </td>
            <td class="p-6 text-right">
                <button onclick="verifyUser('${u.uid}')" class="scout-gradient text-white text-[10px] font-black uppercase px-6 py-2 rounded-full shadow-lg">Verify Access</button>
            </td>
        </tr>`).join('') : `<tr><td colspan="3" class="p-20 text-center text-slate-300 italic font-bold">No pending requests.</td></tr>`;
};

window.verifyUser = async (uid) => {
    await updateDoc(doc(db, "users", uid), { isVerified: true });
    alert("User Approved.");
    loadAdminData();
};
