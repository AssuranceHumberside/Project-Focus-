import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
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
        console.error(e);
        alert("Error loading data. Ensure Firestore rules allow public read access.");
    }
}

function renderGrid() {
    const grid = document.getElementById('district-grid');
    grid.innerHTML = districts.map(district => {
        const districtAudits = allData.filter(a => a.details?.district === district);
        const redFlags = districtAudits.filter(a => 
            Object.values(a.responses || {}).some(r => r.status === "No" || r.status === "Partially")
        ).length;

        return `
            <div onclick="showDistrictDetails('${district}')" class="cursor-pointer bg-white p-6 rounded-xl shadow border-b-4 transition-all hover:scale-105 ${redFlags > 0 ? 'border-red-500' : 'border-emerald-500'}">
                <h3 class="font-bold text-lg text-[#003945]">${district}</h3>
                <p class="text-sm text-slate-500">${districtAudits.length} Total Records</p>
                <p class="text-sm font-bold mt-2 ${redFlags > 0 ? 'text-red-600' : 'text-emerald-600'}">
                    ${redFlags} Sections Needing Support
                </p>
            </div>
        `;
    }).join('');
}

window.showDistrictDetails = (district) => {
    const districtAudits = allData.filter(a => a.details?.district === district);
    document.getElementById('selected-district-name').innerText = `District: ${district}`;
    document.getElementById('response-view').classList.remove('hidden');
    
    const tbody = document.getElementById('response-table-body');
    tbody.innerHTML = districtAudits.map(a => {
        let issues = [];
        if (a.responses) {
            for (const [id, val] of Object.entries(a.responses)) {
                [cite_start]// Check for non-compliant statuses [cite: 2]
                if (val.status === "No" || val.status === "Partially") {
                    issues.push(`
                        <div class="mb-3 p-3 bg-red-50 rounded border-l-4 border-red-400">
                            <div class="text-xs font-black uppercase text-red-800">${id.replace('q_', '').replace('_', ' ')}: ${val.status}</div>
                            <div class="text-sm text-slate-700 mt-1"><strong>Comment:</strong> ${val.explanation || 'No reasoning provided.'}</div>
                            <div class="text-xs font-bold text-red-600 mt-1 italic">Target Date: ${val.deadline || 'No date set'}</div>
                        </div>
                    `);
                }
            }
        }

        const needsSupport = issues.length > 0;

        return `
            <tr class="hover:bg-slate-50">
                <td class="p-4 align-top">
                    <div class="font-bold text-slate-800">${a.details?.group || 'N/A'}</div>
                    <div class="text-xs text-slate-500">${a.details?.section_type || 'N/A'}</div>
                </td>
                <td class="p-4 align-top">
                    <span class="px-2 py-1 rounded text-[10px] font-black uppercase ${needsSupport ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}">
                        ${needsSupport ? 'Action Required' : 'Fully Assured'}
                    </span>
                </td>
                <td class="p-4 align-top w-1/2">
                    ${issues.join('') || '<span class="text-emerald-600 italic text-xs">All standards met according to POR.</span>'}
                </td>
            </tr>
        `;
    }).join('');
    
    window.scrollTo({ top: document.getElementById('response-view').offsetTop, behavior: 'smooth' });
};

window.closeDetails = () => document.getElementById('response-view').classList.add('hidden');

loadDashboard();
