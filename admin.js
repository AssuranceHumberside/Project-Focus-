import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCtLq0oOWyKb_R8Eff86G4XG54xP49uFyg", //
  authDomain: "project-focus-2.firebaseapp.com",
  projectId: "project-focus-2",
  storageBucket: "project-focus-2.firebasestorage.app",
  messagingSenderId: "442223918612",
  appId: "1:442223918612:web:45b50f767725d7adc2b101"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const questionMap = { /* Use the full map provided in the previous turn here */ };
let allData = [];

// SET YOUR SHARED CODE HERE
const SHARED_ACCESS_CODE = "Scouts2024"; 

window.checkAccess = async () => {
    const input = document.getElementById('access-code').value;
    if (input === SHARED_ACCESS_CODE) {
        try {
            // Background login to satisfy Firebase security rules
            // Ensure this user exists in your Firebase 'Users' list
            await signInWithEmailAndPassword(auth, "test@humbersidescouts.org.uk", "password123");
            
            document.getElementById('password-gate').classList.add('hidden');
            document.getElementById('dashboard-ui').classList.remove('hidden');
            loadDashboard();
        } catch (e) { alert("Security Error: Admin user account not found in Firebase."); }
    } else {
        alert("Incorrect Access Code");
    }
};

async function loadDashboard() {
    const querySnapshot = await getDocs(collection(db, "project_focus_records"));
    allData = querySnapshot.docs.map(doc => doc.data());
    renderGrid();
}

function renderGrid() {
    const districts = ["Beverley and Hornsea", "Blacktoft Beacon", "City of Hull", "County Section", "Grimsby and Cleethorpes", "North Lincolnshire", "Pocklington", "South Holderness", "Wolds and Coast"];
    const grid = document.getElementById('district-grid');
    grid.innerHTML = districts.map(district => {
        const districtAudits = allData.filter(a => a.responses?.district?.status === district);
        const redFlags = districtAudits.filter(a => Object.values(a.responses || {}).some(r => r.status === "No" || r.status === "Partially")).length;
        return `
            <div onclick="showDistrictDetails('${district}')" class="cursor-pointer bg-white p-6 rounded-xl shadow border-b-4 transition-all hover:scale-105 ${redFlags > 0 ? 'border-red-500' : 'border-emerald-500'}">
                <h3 class="font-bold text-lg text-[#003945]">${district}</h3>
                <p class="text-sm text-slate-500 font-bold">${districtAudits.length} Records</p>
                <p class="text-sm font-bold mt-2 ${redFlags > 0 ? 'text-red-600' : 'text-emerald-600'}">${redFlags} High Priority</p>
            </div>`;
    }).join('');
}

window.showDistrictDetails = (district) => {
    const districtAudits = allData.filter(a => a.responses?.district?.status === district);
    document.getElementById('selected-district-name').innerText = `Review: ${district}`;
    document.getElementById('response-view').classList.remove('hidden');
    
    const tbody = document.getElementById('response-table-body');
    tbody.innerHTML = districtAudits.map(a => {
        let issues = [];
        const res = a.responses || {};
        for (const [id, val] of Object.entries(res)) {
            if (val.status === "No" || val.status === "Partially") {
                issues.push(`
                    <div class="mb-4 p-4 bg-red-50 rounded border-l-4 border-red-600 shadow-sm">
                        <div class="text-xs font-black text-red-900 uppercase">Question:</div>
                        <div class="text-sm font-bold text-slate-800 mb-2">"${questionMap[id] || id}"</div>
                        <div class="text-sm text-slate-700 bg-white p-3 rounded border border-red-100">
                            <strong>Status:</strong> ${val.status} | <strong>Target:</strong> ${val.deadline || 'TBC'}<br>
                            <span class="block mt-2 italic"><strong>Auditor Comment:</strong> ${val.explanation || 'No reasoning provided.'}</span>
                        </div>
                    </div>`);
            }
        }

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-6 align-top border-r w-1/3">
                    <div class="font-black text-[#003945] text-lg uppercase leading-tight mb-1">${res.group?.status || 'N/A'}</div>
                    <div class="text-sm font-bold text-[#633185] bg-purple-50 px-2 py-1 rounded inline-block mb-4">${res.section_type?.status || 'N/A'}</div>
                    <div class="pt-4 border-t border-slate-100">
                        <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Auditor Name</span>
                        <div class="text-sm font-black text-slate-800">${res.name?.status || 'Unknown'}</div>
                    </div>
                </td>
                <td class="p-6 align-top">
                    ${issues.length > 0 ? issues.join('') : '<div class="text-emerald-600 font-bold italic">✓ Fully Assured</div>'}
                </td>
            </tr>`;
    }).join('');
    window.scrollTo({ top: document.getElementById('response-view').offsetTop - 20, behavior: 'smooth' });
};

window.closeDetails = () => document.getElementById('response-view').classList.add('hidden');
