import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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

// EXPLICIT LOGIN FUNCTION
window.handleAdminLogin = async () => {
    const emailInput = document.getElementById('admin-email').value.trim();
    const passInput = document.getElementById('admin-password').value;
    const btn = document.getElementById('admin-login-btn');

    if (!emailInput || !passInput) {
        alert("Please enter both email and password.");
        return;
    }

    btn.innerText = "Authenticating...";
    btn.disabled = true;

    try {
        const userCred = await signInWithEmailAndPassword(auth, emailInput, passInput);
        
        // Final Gatekeeper check
        if (userCred.user.email === 'tom.harrison@humbersidescouts.org.uk') {
            document.getElementById('admin-auth-ui').classList.add('hidden');
            document.getElementById('dashboard-ui').classList.remove('hidden');
            document.getElementById('admin-nav').classList.remove('hidden');
            await loadAdminData();
        } else {
            alert("Unauthorized SME Account. Access Denied.");
            await signOut(auth);
            location.reload();
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert("Login Failed: " + error.message);
        btn.innerText = "Enter Dashboard";
        btn.disabled = false;
    }
};

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
    } catch (e) {
        console.error("Data Load Error:", e);
        alert("Connected but couldn't load data. Check Firestore Rules.");
    }
}

window.renderGrid = () => {
    const districts = ["Beverley and Hornsea", "Blacktoft Beacon", "City of Hull", "County Section", "Grimsby and Cleethorpes", "North Lincolnshire", "Pocklington", "South Holderness", "Wolds and Coast"];
    const grid = document.getElementById('district-grid');
    
    grid.innerHTML = districts.map(district => {
        const audits = allAuditData.filter(a => {
            const profile = allUserProfiles.find(u => u.uid === a.uid);
            return profile && profile.district === district;
        });
        const redFlags = audits.filter(a => Object.values(a.responses || {}).some(r => r.status !== "Yes")).length;
        
        return `
            <div onclick="showDistrictDetails('${district}')" class="cursor-pointer bg-white p-8 rounded-[2rem] shadow-xl border-b-8 transition-all hover:scale-[1.03] ${redFlags > 0 ? 'border-red-500' : 'border-emerald-500'}">
                <h3 class="font-black text-xl text-[#003945] uppercase italic mb-1">${district}</h3>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${audits.length} Units Audited</p>
                <div class="mt-6 flex justify-between items-end">
                    <span class="text-2xl font-black ${redFlags > 0 ? 'text-red-600' : 'text-emerald-600'}">${redFlags}</span>
                    <span class="text-[9px] font-black uppercase text-slate-400 pb-1 italic">Action Needed</span>
                </div>
            </div>`;
    }).join('');
};

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
        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-10 align-top border-r w-1/3">
                    <div class="font-black text-[#003945] text-2xl uppercase italic tracking-tighter leading-none mb-2">${profile.group || 'N/A'}</div>
                    <div class="text-[11px] font-black text-[#7413dc] bg-purple-50 px-3 py-1 rounded-full inline-block uppercase tracking-widest mb-8 border border-purple-100">${profile.section || 'N/A'}</div>
                    <div class="pt-6 border-t border-slate-100">
                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 underline decoration-teal-500">${profile.email || 'Email Missing'}</span>
                        <div class="text-xs font-black text-slate-800 uppercase tracking-tight">${profile.name || 'Anonymous'}</div>
                    </div>
                </td>
                <td class="p-10 align-top">
                    <div class="text-xs text-slate-400 italic">Details view active.</div>
                </td>
            </tr>`;
    }).join('');
    window.scrollTo({ top: document.getElementById('response-view').offsetTop - 20, behavior: 'smooth' });
};

window.renderUserList = () => {
    const tbody = document.getElementById('user-table-body');
    const pending = allUserProfiles.filter(u => !u.isVerified);
    tbody.innerHTML = pending.length ? pending.map(u => `
        <tr class="hover:bg-slate-50">
            <td class="p-6 font-bold text-[#003945] underline decoration-yellow-400">${u.email}</td>
            <td class="p-6 text-sm font-black text-slate-700 uppercase">${u.group} - ${u.section}</td>
            <td class="p-6 text-right">
                <button onclick="verifyUser('${u.uid}')" class="scout-gradient text-white text-[10px] font-black uppercase px-6 py-2 rounded-full shadow-lg">Verify Auditor</button>
            </td>
        </tr>`).join('') : `<tr><td colspan="3" class="p-20 text-center text-slate-300 italic font-bold">No pending requests.</td></tr>`;
};

window.verifyUser = async (uid) => {
    try {
        await updateDoc(doc(db, "users", uid), { isVerified: true });
        alert("Approved! Auditor can now log in.");
        await loadAdminData();
    } catch (e) { alert("Error approving user."); }
};

window.switchTab = (tab) => {
    document.getElementById('tab-audits').classList.toggle('hidden', tab !== 'audits');
    document.getElementById('tab-users').classList.toggle('hidden', tab !== 'users');
};

window.closeDetails = () => document.getElementById('response-view').classList.add('hidden');
window.handleAdminLogout = () => { signOut(auth); location.reload(); };
