import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCtLq0oOWyKb_R8Eff86G4XG54xP49uFyg",
  authDomain: "project-focus-2.firebaseapp.com",
  projectId: "project-focus-2",
  storageBucket: "project-focus-2.firebasestorage.app",
  messagingSenderId: "442223918612",
  appId: "1:442223918612:web:45b50f767725d7adc2b101"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const districts = [
    "Beverley and Hornsea", "Blacktoft Beacon", "City of Hull", "County Section",
    "Grimsby and Cleethorpes", "North Lincolnshire", "Pocklington", 
    "South Holderness", "Wolds and Coast"
];

let allData = [];

async function loadDashboard() {
    try {
        const querySnapshot = await getDocs(collection(db, "project_focus_records"));
        allData = querySnapshot.docs.map(doc => doc.data());
        renderGrid();
    } catch (e) {
        alert("Error loading data. Ensure Firestore rules allow public read access.");
    }
}

function renderGrid() {
    const grid = document.getElementById('district-grid');
    grid.innerHTML = districts.map(district => {
        const districtAudits = allData.filter(a => a.details?.district === district || a.responses?.district?.status === district);
        const redFlags = districtAudits.filter(a => 
            Object.values(a.responses || {}).some(r => r.status === "No" || r.status === "Partially")
        ).length;

        return `
            <div onclick="showDistrictDetails('${district}')" class="cursor-pointer bg-white p-6 rounded-xl shadow border-b-4 transition-all hover:scale-105 ${redFlags > 0 ? 'border-red-500' : 'border-emerald-500'}">
                <h3 class="font-bold text-lg text-[#003945]">${district}</h3>
                <p class="text-sm text-slate-500">${districtAudits.length} Audits Completed</p>
                <p class="text-sm font-bold mt-2 ${redFlags > 0 ? 'text-red-600' : 'text-emerald-600'}">
                    ${redFlags} Sections with Actions
                </p>
            </div>
        `;
    }).join('');
}

window.showDistrictDetails = (district) => {
    // Filter by district [cite: 6]
    const districtAudits = allData.filter(a => a.details?.district === district || a.responses?.district?.status === district);
    document.getElementById('selected-district-name').innerText = `Assurance Review: ${district}`;
    document.getElementById('response-view').classList.remove('hidden');
    
    const tbody = document.getElementById('response-table-body');
    tbody.innerHTML = districtAudits.map(a => {
        let issues = [];
        const responses = a.responses || {};
        
        // Loop through responses to find "No" or "Partially" 
        for (const [id, val] of Object.entries(responses)) {
            if (val.status === "No" || val.status === "Partially") {
                issues.push(`
                    <div class="mb-4 p-4 bg-red-50 rounded border-l-4 border-red-500 shadow-sm">
                        <div class="text-xs font-black uppercase text-red-800 tracking-tight">Requirement: ${id.replace('q_', '').replace('_', ' ')}</div>
                        <div class="text-sm font-bold text-slate-800 mt-1">Status: ${val.status}</div>
                        <div class="text-sm text-slate-700 mt-2 bg-white p-2 rounded border border-red-100 italic">
                            <strong>Auditor Comment:</strong> ${val.explanation || 'No reasoning provided.'}
                        </div>
                        <div class="text-xs font-black text-red-600 mt-2 flex items-center gap-1">
                            <span class="bg-red-600 text-white px-2 py-0.5 rounded">TARGET DATE: ${val.deadline || 'TBC'}</span>
                        </div>
                    </div>
                `);
            }
        }

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-6 align-top border-r">
                    <div class="font-black text-[#003945] text-lg uppercase leading-tight">${a.details?.group || a.responses?.group?.status || 'N/A'}</div>
                    <div class="text-sm font-bold text-slate-600 mt-1">${a.details?.section_type || a.responses?.section_type?.status || 'N/A'}</div>
                    <div class="mt-4 pt-4 border-t border-slate-100">
                        <div class="text-[10px] uppercase font-bold text-slate-400">Auditor Name</div>
                        <div class="text-sm font-bold text-slate-800">${a.details?.name || a.responses?.name?.status || 'Unknown'}</div>
                    </div>
                </td>
                <td class="p-6 align-top">
                    ${issues.length > 0 ? issues.join('') : '<div class="text-emerald-600 font-bold flex items-center gap-2 italic">✓ All Standards Met in this Section</div>'}
                </td>
            </tr>
        `;
    }).join('');
    
    window.scrollTo({ top: document.getElementById('response-view').offsetTop - 50, behavior: 'smooth' });
};

window.closeDetails = () => document.getElementById('response-view').classList.add('hidden');

loadDashboard();
