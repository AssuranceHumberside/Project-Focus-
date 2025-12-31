import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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
const auth = getAuth(app);
const db = getFirestore(app);

const questionMap = {
    "q_dbs": "Can you confirm every leader and adult helper regularly attending has completed DBS, AAC, and Welcome Conversations? [cite: 10]",
    "q_risk": "Is a written risk assessment produced for every activity, and is it shared with all adults involved?",
    "q_training": "Has every member of the section leadership team completed their mandatory safety and safeguarding training?",
    "q_approval": "For all activities held away from your regular meeting place, do you ensure they are approved by the relevant Lead Volunteer?",
    "q14": "Is a robust InTouch process active and communicated for every meeting and trip? [cite: 14]",
    "q_yellow": "Does every adult volunteer have access to the Yellow Card and understand their safeguarding responsibilities?",
    "q12": "Do you have a clear supervision plan that covers structured activities, 'free time,' and adult-to-young person ratios? [cite: 12]",
    "q37": "Does the Leader in Charge perform regular headcounts or maintain an accurate register to account for everyone? [cite: 37]",
    "q16": "Are up-to-date medical and health details for all (including adults) immediately accessible during all activities? [cite: 16]",
    "q33": "Do you have a clear plan for how to handle an emergency, and do all adults know their specific role within it? [cite: 33]",
    "q31": "Is a fully-stocked first-aid kit available and easily accessible to all leaders at all times? [cite: 31]",
    "q42": "Does every adult understand how and when to record and report accidents, near-misses, or 'minor' injuries? [cite: 42]",
    "q20": "Have all practical steps been taken to identify and reduce tripping or slipping hazards in your meeting place? [cite: 20]",
    "q18": "Are all chairs, tables, and equipment stored safely and securely when not in use to prevent injury? [cite: 18]",
    "q25": "Has the potential for falls onto sharp objects, solid surfaces, or glass been minimised as far as is practically possible? [cite: 25]",
    "q22": "Do you regularly check for overhead hazards and ensure that all lights are appropriately guarded? [cite: 22]",
    "q23": "Are clear boundaries and activity limits briefed to and understood by all young people at the start of every meeting? [cite: 23]",
    "q30": "Is all equipment used by the section regularly inspected to ensure it is safe and in good working order? [cite: 30]",
    "q27": "Are all games and activities chosen specifically to be suitable for the age and ability of participants? [cite: 27]",
    "q28": "Are the rules of every game clearly briefed and understood by both participants and leaders before play begins? [cite: 28]",
    "q_dynamic": "Do you actively 'check and challenge' safety throughout a meeting, stopping activities if risks change?",
    "q36": "Is a specific 'Leader in Charge' clearly identified and known to all adults and young people for every session? [cite: 36]",
    "q39": "Does the Leader in Charge assign specific responsibilities to other adults to ensure adequate oversight? [cite: 39]",
    "q43": "Is safety a standard talking point at the start of all events, during camp planning, and in post-activity reviews? [cite: 43]",
    "q47": "Is the leadership team supported to attend training and continuously improve their professional knowledge of safety? [cite: 47]",
    "q49": "Is all safety-specific equipment in the meeting place inspected on a regular, scheduled basis? [cite: 49]"
};

let allData = [];

window.handleAdminLogin = async () => {
    const email = document.getElementById('admin-email').value;
    const pass = document.getElementById('admin-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        document.getElementById('admin-auth-ui').classList.add('hidden');
        document.getElementById('dashboard-ui').classList.remove('hidden');
        loadDashboard();
    } catch (e) { alert("Login Denied: " + e.message); }
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
    document.getElementById('selected-district-name').innerText = `Reviewing: ${district}`;
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
                        <div class="text-sm font-bold text-slate-800 mb-2 leading-tight">"${questionMap[id] || id}"</div>
                        <div class="text-sm text-slate-700 bg-white p-3 rounded border border-red-100">
                            <strong>Status:</strong> ${val.status} | <strong>Target:</strong> ${val.deadline || 'TBC'}<br>
                            <span class="block mt-2 italic"><strong>Auditor Comment:</strong> ${val.explanation || 'No reasoning provided.'}</span>
                        </div>
                    </div>`);
            }
        }
        return `
            <tr class="hover:bg-slate-50">
                <td class="p-6 align-top border-r w-1/3">
                    <div class="font-black text-[#003945] text-lg uppercase leading-tight mb-1">${res.group?.status || 'N/A'}</div>
                    <div class="text-xs font-bold text-[#633185] bg-purple-50 px-2 py-1 rounded inline-block mb-4">${res.section_type?.status || 'N/A'}</div>
                    <div class="pt-4 border-t border-slate-100">
                        <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Auditor Name</span>
                        <div class="text-sm font-black text-slate-800">${res.name?.status || 'Unknown'}</div>
                    </div>
                </td>
                <td class="p-6 align-top">${issues.length > 0 ? issues.join('') : '<div class="text-emerald-600 font-bold italic">✓ Fully Assured</div>'}</td>
            </tr>`;
    }).join('');
    window.scrollTo({ top: document.getElementById('response-view').offsetTop - 20, behavior: 'smooth' });
};

window.closeDetails = () => document.getElementById('response-view').classList.add('hidden');
