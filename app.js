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
    { title: "Section 1: Identification", questions: [
        [cite_start]{ id: "name", type: "text", text: "What is your full name? [cite: 4]" },
        [cite_start]{ id: "email_contact", type: "text", text: "What is your contact email address? [cite: 5]" },
        [cite_start]{ id: "district", type: "select", text: "Which District is your section part of? [cite: 6]", options: ["Beverley and Hornsea", "Blacktoft Beacon", "City of Hull", "County Section", "Grimsby and Cleethorpes", "North Lincolnshire", "Pocklington", "South Holderness", "Wolds and Coast"] },
        [cite_start]{ id: "group", type: "text", text: "Which Scout Group do you belong to? [cite: 7]" },
        [cite_start]{ id: "section_type", type: "text", text: "Which specific section are you auditing? [cite: 8]" }
    ]},
    { title: "Section 2: Preparation and Planning", questions: [
        [cite_start]{ id: "q10", text: "Are all leaders and adult helpers up to date with DBS, AAC, and Welcome Conversations? [cite: 10]" },
        [cite_start]{ id: "q_risk", text: "Is a written risk assessment produced for every activity and shared with all adults? [cite: 43, 45]" },
        [cite_start]{ id: "q_training", text: "Has the section leadership team completed all mandatory safety and safeguarding training? [cite: 47]" },
        { id: "q_approval", text: "Are all activities held away from your regular meeting place approved by the Lead Volunteer?" },
        [cite_start]{ id: "q14", text: "Is a robust InTouch process active and communicated for every meeting and trip? [cite: 14]" },
        { id: "q_yellow", text: "Does every adult have access to the Yellow Card and understand how to report concerns?" }
    ]},
    { title: "Section 3: Meetings & Activities", questions: [
        [cite_start]{ id: "q12", text: "Is there a suitable supervision plan in place for all meetings, including 'free time'? [cite: 12]" },
        [cite_start]{ id: "q37", text: "Does the Leader in Charge perform regular headcounts to account for everyone? [cite: 37]" },
        [cite_start]{ id: "q16", text: "Are up-to-date medical and health details for everyone immediately accessible? [cite: 16]" },
        [cite_start]{ id: "q33", text: "Is there a clear plan for emergencies, known to all adults in the team? [cite: 33]" },
        [cite_start]{ id: "q31", text: "Is a fully-stocked first-aid kit available and accessible at all times? [cite: 31]" },
        [cite_start]{ id: "q42", text: "Does every adult understand how and when to record and report incidents? [cite: 42]" }
    ]},
    { title: "Section 4: The Physical Environment", questions: [
        [cite_start]{ id: "q20", text: "Have all practical steps been taken to identify and reduce tripping or slipping hazards? [cite: 20]" },
        [cite_start]{ id: "q18", text: "Are all chairs, tables, and equipment stored safely when not in use? [cite: 18]" },
        [cite_start]{ id: "q25", text: "Has the potential for falls onto sharp objects or glass been minimised? [cite: 25]" },
        [cite_start]{ id: "q22", text: "Do you regularly check for overhead hazards and unguarded lights? [cite: 22]" },
        [cite_start]{ id: "q23", text: "Are clear boundaries and activity limits briefed to young people at the start? [cite: 23]" },
        [cite_start]{ id: "q30", text: "Is all equipment used by the section regularly checked for safety? [cite: 30]" }
    ]},
    { title: "Section 5: Program & Culture", questions: [
        [cite_start]{ id: "q27", text: "Are all games and activities suitable for the age and ability of participants? [cite: 27]" },
        [cite_start]{ id: "q28", text: "Are the rules of every game briefed and understood before play begins? [cite: 28]" },
        { id: "q_dynamic", text: "Do you actively 'check and challenge' safety throughout a meeting?" },
        [cite_start]{ id: "q36", text: "Is a specific 'Leader in Charge' clearly identified and known for every session? [cite: 36]" },
        [cite_start]{ id: "q39", text: "Does the Leader in Charge assign specific roles to other adults? [cite: 39]" },
        [cite_start]{ id: "q43", text: "Is safety discussed at planning meetings and post-activity reviews? [cite: 43]" },
        [cite_start]{ id: "q49", text: "Is all safety-specific equipment in the meeting place inspected regularly? [cite: 49]" }
    ]}
];

window.handleLogin = async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try {
        const userCred = await signInWithEmailAndPassword(auth, email, pass);
        const docSnap = await getDoc(doc(db, "project_focus_records", userCred.user.uid));
        userProgress = docSnap.exists() ? docSnap.data().responses : {};
        document.getElementById('auth-ui').classList.add('hidden');
        document.getElementById('audit-ui').classList.remove('hidden');
        renderStep();
    } catch (e) { alert("Login Error: " + e.message); }
};

function renderStep() {
    const section = sections[currentStep];
    const container = document.getElementById('form-container');
    document.getElementById('section-title').innerText = section.title;
    document.getElementById('form-container').classList.remove('hidden');
    document.getElementById('summary-view').classList.add('hidden');

    for(let i=1; i<=5; i++) {
        document.getElementById(`prog-${i}`).classList.toggle('scouts-teal', i <= currentStep + 1);
        document.getElementById(`prog-${i}`).classList.toggle('bg-slate-200', i > currentStep + 1);
    }

    container.innerHTML = section.questions.map(q => {
        const saved = userProgress[q.id] || {};
        if (q.type === 'text') return renderTextField(q, saved);
        if (q.type === 'select') return renderSelectField(q, saved);
        return renderAuditQuestion(q, saved);
    }).join('');

    document.getElementById('prev-btn').classList.toggle('hidden', currentStep === 0);
}

window.showSummary = () => {
    const currentQuestions = sections[currentStep].questions;
    const allAnswered = currentQuestions.every(q => userProgress[q.id] && userProgress[q.id].status);
    
    if (!allAnswered) return alert("Please complete all questions in this section before reviewing.");

    document.getElementById('form-container').classList.add('hidden');
    document.getElementById('summary-view').classList.remove('hidden');
    const content = document.getElementById('summary-content');
    
    content.innerHTML = currentQuestions.map(q => `
        <div class="flex justify-between border-b py-2 text-sm">
            <span class="text-slate-600">${q.text}</span>
            <span class="font-bold scouts-teal-text">${userProgress[q.id].status}</span>
        </div>
    `).join('');
};

window.confirmSection = () => {
    currentStep++;
    if (currentStep < sections.length) {
        renderStep();
    } else {
        document.getElementById('next-btn').classList.add('hidden');
        document.getElementById('submit-btn').classList.remove('hidden');
    }
};

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
            <div class="${(saved.status === 'Partially' || saved.status === 'No') ? '' : 'hidden'} space-y-3 pt-4 border-t border-red-100">
                <textarea placeholder="Observation..." onchange="saveField('${q.id}', this.value, 'explanation')" class="w-full border p-3 rounded text-sm bg-red-50/30">${saved.explanation || ''}</textarea>
                <input type="date" value="${saved.deadline || ''}" onchange="saveField('${q.id}', this.value, 'deadline')" class="border p-3 rounded text-sm w-full md:w-auto">
            </div>
        </div>
    `;
}

function renderTextField(q, saved) {
    return `<div class="bg-white p-6 rounded border"><label class="block font-bold mb-2">${q.text}</label><input type="text" value="${saved.status || ''}" onchange="saveField('${q.id}', this.value)" class="w-full border p-3 rounded"></div>`;
}

function renderSelectField(q, saved) {
    return `<div class="bg-white p-6 rounded border"><label class="block font-bold mb-2">${q.text}</label><select onchange="saveField('${q.id}', this.value)" class="w-full border p-3 rounded"><option value="">Select...</option>${q.options.map(o => `<option value="${o}" ${saved.status === o ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`;
}

window.handleLogout = async () => { await signOut(auth); location.reload(); };
window.finalSubmit = () => { alert("Record finalized. Thank you."); handleLogout(); };
