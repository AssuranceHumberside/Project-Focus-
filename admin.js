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

// Question Map to display full text in Admin 
const questionMap = {
    "q_dbs": "Can you confirm every leader and adult helper regularly attending has completed DBS, AAC, and Welcome Conversations?",
    "q_risk": "Is a written risk assessment produced for every activity, and is it shared with all adults involved?",
    "q_training": "Has every member of the section leadership team completed their mandatory safety and safeguarding training?",
    "q_approval": "For all activities held away from your regular meeting place, do you ensure they are approved by the relevant Lead Volunteer?",
    "q14": "Is a robust InTouch process active and communicated for every meeting and trip?",
    "q_yellow": "Does every adult volunteer have access to the Yellow Card and understand their safeguarding responsibilities?",
    "q12": "Do you have a clear supervision plan that covers structured activities, 'free time,' and adult-to-young person ratios?",
    "q37": "Does the Leader in Charge perform regular headcounts or maintain an accurate register to account for everyone?",
    "q16": "Are up-to-date medical and health details for all (including adults) immediately accessible during all activities?",
    "q33": "Do you have a clear plan for how to handle an emergency, and do all adults know their specific role within it?",
    "q31": "Is a fully-stocked first-aid kit available and easily accessible to all leaders at all times?",
    "q42": "Does every adult understand how and when to record and report accidents, near-misses, or 'minor' injuries?",
    "q20": "Have all practical steps been taken to identify and reduce tripping or slipping hazards in your meeting place?",
    "q18": "Are all chairs, tables, and equipment stored safely and securely when not in use to prevent injury?",
    "q25": "Has the potential for falls onto sharp objects, solid surfaces, or glass been minimised as far as is practically possible?",
    "q22": "Do you regularly check for overhead hazards and ensure that all lights are appropriately guarded?",
    "q23": "Are clear boundaries and activity limits briefed to and understood by all young people at the start of every meeting?",
    "q30": "Is all equipment used by the section regularly inspected to ensure it is safe and in good working order?",
    "q27": "Are all games and activities chosen specifically to be suitable for the age and ability of participants?",
    "q28": "Are the rules of every game clearly briefed and understood by both participants and leaders before play begins?",
    "q_dynamic": "Do you actively 'check and challenge' safety throughout a meeting, stopping activities if risks change?",
    "q36": "Is a specific 'Leader in Charge' clearly identified and known to all adults and young people for every session?",
    "q39": "Does the Leader in Charge assign specific responsibilities to other adults to ensure adequate oversight?",
    "q43": "Is safety a standard talking point at the start of all events, during camp planning, and in post-activity reviews?",
    "q47": "Is the leadership team supported to attend training and continuously improve their professional knowledge of safety?",
    "q49": "Is all safety-specific equipment in the meeting place inspected on a regular, scheduled basis?"
};

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
    const districts = [
        "Beverley and Hornsea", "Blacktoft Beacon", "City of Hull", "County Section",
        "Grimsby and Cleethorpes", "North Lincolnshire", "Pocklington", 
        "South Holderness", "Wolds and Coast"
    ];
    const grid = document.getElementById('district-grid');
    grid.innerHTML = districts.map(district => {
        const districtAudits = allData.filter(a => a.details?.district === district);
        const redFlags = districtAudits.filter(a => 
            Object.values(a.responses || {}).some(r => r.status === "No" || r.status === "Partially")
        ).length;

        return `
            <div onclick="showDistrictDetails('${district}')" class="cursor-pointer bg-white p-6 rounded-xl shadow border-b-4 transition-all hover:scale-105 ${redFlags > 0 ? 'border-red-500' : 'border-emerald-500'}">
                <h3 class="font-bold text-lg text-[#003945]">${district}</h3>
                <p class="text-sm text-slate-500 font-bold">${districtAudits.length} Completed Records</p>
                <p class="text-sm font-bold mt-2 ${redFlags > 0 ? 'text-red-600' : 'text-emerald-600'}">
                    ${redFlags} Sections with Actions
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
        const responses = a.responses || {};
        
        for (const [id, val] of Object.entries(responses)) {
            if (val.status === "No" || val.status === "Partially") {
                const questionText = questionMap[id] || id.replace('q_', '').replace('_', ' ');
                issues.push(`
                    <div class="mb-4 p-4 bg-red-50 rounded border-l-4 border-red-600 shadow-sm">
                        <div class="text-xs font-black text-red-900 uppercase mb-1 tracking-tight">Question Asked:</div>
                        <div class="text-sm font-bold text-slate-800 mb-2 leading-tight">"${questionText}"</div>
                        <div class="flex gap-2 mb-2">
                             <span class="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-black uppercase">Status: ${val.status}</span>
                             <span class="text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded font-black uppercase">Target: ${val.deadline || 'TBC'}</span>
                        </div>
                        <div class="text-sm text-slate-700 bg-white p-3 rounded border border-red-100">
                            <strong class="text-xs uppercase block text-slate-500 mb-1">Auditor Comment:</strong>
                            ${val.explanation || 'No reasoning provided.'}
                        </div>
                    </div>
                `);
            }
        }

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-6 align-top border-r w-1/3">
                    <div class="font-black text-[#003945] text-lg uppercase leading-none mb-1">${a.details?.group || 'Unknown Group'}</div>
                    <div class="text-sm font-bold text-slate-500 mb-4">${a.details?.section_type || 'Section TBC'}</div>
                    <div class="pt-4 border-t border-slate-100">
                        <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Auditor</span>
                        <div class="text-sm font-black text-slate-800">${a.details?.name || 'Unknown'}</div>
                    </div>
                </td>
                <td class="p-6 align-top">
                    ${issues.length > 0 ? issues.join('') : '<div class="text-emerald-600 font-bold italic">✓ Fully Assured (No Actions)</div>'}
                </td>
            </tr>
        `;
    }).join('');
    
    window.scrollTo({ top: document.getElementById('response-view').offsetTop - 20, behavior: 'smooth' });
};

window.closeDetails = () => document.getElementById('response-view').classList.add('hidden');

loadDashboard();
