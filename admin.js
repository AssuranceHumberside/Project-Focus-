import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCtLq8oOWyKb_R8Eff86G4XG54xP49uFyg", 
  authDomain: "project-focus-2.firebaseapp.com",
  projectId: "project-focus-2",
  storageBucket: "project-focus-2.firebasestorage.app",
  messagingSenderId: "442223918612",
  appId: "1:442223918612:web:45b50f767725d7adc2b101"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allAudits = [];
const districtList = [
    "Beverley and Hornsea", "Blacktoft Beacon", "City of Hull", "County Section",
    "Grimsby and Cleethorpes", "North Lincolnshire", "Pocklington", 
    "South Holderness", "Wolds and Coast"
];

async function loadData() {
    const querySnapshot = await getDocs(collection(db, "project_focus_records"));
    allAudits = querySnapshot.docs.map(doc => doc.data());
    showDistricts();
}

window.showDistricts = () => {
    const container = document.getElementById('district-view');
    document.getElementById('district-view').classList.remove('hidden');
    document.getElementById('detail-view').classList.add('hidden');
    document.getElementById('back-btn').classList.add('hidden');
    
    container.innerHTML = districtList.map(district => {
        const districtAudits = allAudits.filter(a => a.details.district === district);
        const actionItems = districtAudits.filter(a => 
            Object.values(a.responses).some(r => r.status !== "Yes")
        ).length;

        return `
            <div onclick="showDetails('${district}')" class="cursor-pointer bg-white p-6 rounded-xl shadow hover:border-teal-500 border-2 transition-all ${actionItems > 0 ? 'bg-red-50' : 'bg-teal-50'}">
                <h3 class="font-bold text-lg text-teal-900">${district}</h3>
                <p class="text-sm text-slate-600">${districtAudits.length} Records</p>
                <p class="text-sm font-bold ${actionItems > 0 ? 'text-red-600' : 'text-teal-600'}">
                    ${actionItems} Requiring Support
                </p>
            </div>
        `;
    }).join('');
};

window.showDetails = (district) => {
    document.getElementById('district-view').classList.add('hidden');
    document.getElementById('detail-view').classList.remove('hidden');
    document.getElementById('back-btn').classList.remove('hidden');
    document.getElementById('detail-title').innerText = `Project FOCUS Detail: ${district}`;

    const districtAudits = allAudits.filter(a => a.details.district === district);
    const tableBody = document.getElementById('detail-table-body');
    
    tableBody.innerHTML = districtAudits.map(a => {
        let issues = [];
        for (const [qId, res] of Object.entries(a.responses)) {
            if (res.status !== "Yes") issues.push(`- ${res.explanation} (Due: ${res.deadline})`);
        }

        return `
            <tr class="border-b">
                <td class="p-4 font-bold text-teal-900">${a.details.group} - ${a.details.section}</td>
                <td class="p-4 font-bold ${issues.length > 0 ? 'text-red-600' : 'text-teal-600'} uppercase text-xs">
                    ${issues.length > 0 ? 'Action Needed' : 'Compliance Met'}
                </td>
                <td class="p-4 text-xs italic text-slate-600">${issues.join('<br>') || 'Full adherence to Scouts POR.'}</td>
            </tr>
        `;
    }).join('');
};

loadData();
