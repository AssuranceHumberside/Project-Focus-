import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

let currentStep = 0;
let userProgress = {};

const sections = [
    { title: "Section 1: Basic Details", questions: [
        { id: "name", type: "text", text: "Full Name" },
        { id: "district", type: "select", text: "District", options: ["Beverley and Hornsea", "Blacktoft Beacon", "City of Hull", "County Section", "Grimsby and Cleethorpes", "North Lincolnshire", "Pocklington", "South Holderness", "Wolds and Coast"] },
        { id: "group", type: "text", text: "Scout Group" },
        { id: "section", type: "text", text: "Section (e.g. Squirrels, Beavers, Cubs, Scouts, Explorers)" }
    ]},
    { title: "Section 2: Meetings & Activities", questions: [
        { id: "q10", text: "Appropriate enquiries (DBS/AAC) undertaken for leaders/helpers regularly attending[cite: 10]." },
        { id: "q12", text: "Suitable supervision plan for meetings/visits, including free time[cite: 12]." },
        { id: "q14", text: "Appropriate InTouch process in place for meetings/visits[cite: 14]." },
        { id: "q16", text: "Medical/health details available for all people (inc adults)[cite: 16]." },
        { id: "q18", text: "Chairs/tables stored safely in the meeting place[cite: 18]." },
        { id: "q20", text: "Tripping/slipping hazards reduced in meeting places[cite: 20]." },
        { id: "q22", text: "Consideration given to overhead hazards/unguarded lights[cite: 22]." },
        { id: "q23", text: "Boundaries briefed and understood by young people[cite: 23]." },
        { id: "q25", text: "Potential for falls on sharp objects/glass minimised[cite: 25]." },
        { id: "q27", text: "Games suitable for age and ability of participants[cite: 27]." },
        { id: "q28", text: "Rules of games briefed and understood by all[cite: 28]." },
        { id: "q30", text: "All equipment used is checked and in good order[cite: 30]." },
        { id: "q31", text: "First-aid kit accessible at all times[cite: 31]." },
        { id: "q33", text: "Plan for emergency during meetings/visits is in place[cite: 33]." }
    ]},
    { title: "Section 3: Leader in Charge", questions: [
        { id: "q36", text: "Identified leader in charge for all activities[cite: 36]." },
        { id: "q37", text: "Leader in charge accounts for all people regularly[cite: 37]." },
        { id: "q39", text: "Leader in charge allocates specific roles/responsibilities[cite: 39]." }
    ]},
    { title: "Section 4: Safety Always", questions: [
        { id: "q42", text: "Everyone understands how to record/report incidents[cite: 42]." },
        { id: "q43", text: "Safety discussed at planning, start of events and reviews[cite: 43]." },
        { id: "q45", text: "Training/guidance given to all before activity/event[cite: 45]." },
        { id: "q47", text: "Leadership team supported to gain safety knowledge[cite: 47]." },
        { id: "q49", text: "Safety equipment in meeting place inspected regularly[cite: 49]." }
    ]}
];

window.handleLogin = async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try {
        const userCred = await signInWithEmailAndPassword(auth, email, pass);
        const docSnap = await getDoc(doc(db, "project_focus_records", userCred.user.uid));
        
        userProgress = docSnap.exists() ? docSnap.data().responses : {};
        document.getElementById('current-user-email').innerText = email;
        document.getElementById('user-status').classList.remove('hidden');
        document.getElementById('auth-ui').classList.add('hidden');
        document.getElementById('audit-ui').classList.remove('hidden');
        renderStep();
    } catch (e) { alert("Login Error: " + e.message); }
};

function renderStep() {
    const section = sections[currentStep];
    const container = document.getElementById('form-container');
    document.getElementById('section-title').innerText = section.title;

    // Update Progress UI
    for(let i=1; i<=4; i++) {
        const bar = document.getElementById(`prog-${i}`);
        bar.classList.toggle('scouts-teal', i <= currentStep + 1);
        bar.classList.toggle('bg-slate-200', i > currentStep + 1);
    }

    container.innerHTML = section.questions.map(q => {
        const saved = userProgress[q.id] || {};
        if (q.type === 'text') return renderTextField(q, saved);
        if (q.type === 'select') return renderSelectField(q, saved);
        return renderAuditQuestion(q, saved);
    }).join('');

    document.getElementById('prev-btn').classList.toggle('hidden', currentStep === 0);
    document.getElementById('next-btn').classList.toggle('hidden', currentStep === 3);
    document.getElementById('submit-btn').classList.toggle('hidden', currentStep !== 3);
}

window.saveField = async (id, value, type = 'status') => {
    if (!userProgress[id]) userProgress[id] = {};
    if (type === 'explanation') userProgress[id].explanation = value;
    else if (type === 'deadline') userProgress[id].deadline = value;
    else userProgress[id].status = value;

    await setDoc(doc(db, "project_focus_records", auth.currentUser.uid), {
        responses: userProgress,
        lastUpdated: new Date().toISOString()
    }, { merge: true });
};

function renderAuditQuestion(q, saved) {
    return `
        <div class="bg-white p-6 rounded shadow ${saved.status ? (saved.status === 'Yes' ? 'met-card' : 'action-card') : 'border'}">
            <p class="font-bold text-slate-800 mb-4">${q.text}</p>
            <div class="flex gap-6 mb-4">
                ${['Yes', 'Partially', 'No'].map(v => `
                    <label class="flex items-center gap-2 cursor-pointer text-sm">
                        <input type="radio" name="${q.id}" value="${v}" ${saved.status === v ? 'checked' : ''} 
                        onchange="saveField('${q.id}', '${v}'); renderStep();"> ${v}
                    </label>
                `).join('')}
            </div>
            <div class="${(saved.status === 'Partially' || saved.status === 'No') ? '' : 'hidden'} space-y-4 pt-4 border-t">
                <p class="text-xs font-bold text-red-700 uppercase">Reasoning & Target Resolution Date:</p>
                <textarea placeholder="Please explain the issue..." onchange="saveField('${q.id}', this.value, 'explanation')" class="w-full border p-3 rounded text-sm">${saved.explanation || ''}</textarea>
                <input type="date" value="${saved.deadline || ''}" onchange="saveField('${q.id}', this.value, 'deadline')" class="border p-3 rounded text-sm w-full md:w-auto">
            </div>
        </div>
    `;
}

function renderTextField(q, saved) {
    return `
        <div class="bg-white p-6 rounded border">
            <label class="block font-bold text-slate-800 mb-2">${q.text}</label>
            <input type="text" value="${saved.status || ''}" onchange="saveField('${q.id}', this.value)" class="w-full border p-3 rounded shadow-sm">
        </div>
    `;
}

function renderSelectField(q, saved) {
    return `
        <div class="bg-white p-6 rounded border">
            <label class="block font-bold text-slate-800 mb-2">${q.text}</label>
            <select onchange="saveField('${q.id}', this.value)" class="w-full border p-3 rounded shadow-sm">
                <option value="">Select...</option>
                ${q.options.map(o => `<option value="${o}" ${saved.status === o ? 'selected' : ''}>${o}</option>`).join('')}
            </select>
        </div>
    `;
}

window.changeSection = (dir) => {
    const sectionQuestions = sections[currentStep].questions;
    const allAnswered = sectionQuestions.every(q => userProgress[q.id] && userProgress[q.id].status);
    
    if (dir === 1 && !allAnswered) return alert("Please complete all fields in this section to continue.");
    
    currentStep += dir;
    renderStep();
    window.scrollTo(0,0);
};

window.handleLogout = async () => {
    await signOut(auth);
    location.reload();
};

window.finalSubmit = async () => {
    alert("Project FOCUS record submitted and finalized. Thank you for your commitment to safety.");
    handleLogout();
};
