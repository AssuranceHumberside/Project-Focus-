import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your specific config from Project Focus 2
const firebaseConfig = {
  apiKey: "AIzaSyCtLq8o0WyKb_R8Eff86G4XG54xp4uFYg",
  authDomain: "project-focus-2.firebaseapp.com",
  projectId: "project-focus-2",
  storageBucket: "project-focus-2.firebasestorage.app",
  messagingSenderId: "442223918612",
  appId: "1:442223918612:web:45b50f767725d7adc2b101",
  measurementId: "G-LBV9726LQ2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Complete Audit Questions from the Humberside document
const questions = [
    { id: "dbs", text: "All leaders/helpers have appropriate enquiries (DBS/AAC/Welcome Conversations)." },
    { id: "supervision", text: "Suitable supervision plan in place for all section meetings and visits." },
    { id: "intouch", text: "Appropriate InTouch process in place for all section meetings and visits." },
    { id: "medical", text: "All medical and health details are available for all people (including adults)." },
    { id: "storage", text: "Chairs and tables are stored safely in the meeting place when not in use." },
    { id: "tripping", text: "Tripping or slipping hazards have been reduced, as far as possible." },
    { id: "overhead", text: "Consideration given to overhead hazards and unguarded lights." },
    { id: "boundaries", text: "Boundaries and limits are briefed and understood by all young people." },
    { id: "falls", text: "Potential for falls on solid or sharp objects and glass has been minimised." },
    { id: "games_age", text: "All games played are suitable for the age and ability of participants." },
    { id: "games_rules", text: "Rules of all games played are briefed and understood by participants." },
    { id: "equipment", text: "All equipment used by the section is checked, safe and in good order." },
    { id: "firstaid", text: "First-aid kit available and accessible at all times." },
    { id: "emergency", text: "Plan for what to do in an emergency during all section meetings." },
    { id: "lic_id", text: "Identified leader in charge for all meetings, events or activities." },
    { id: "lic_account", text: "Leader in charge ensures all adults and young people are accounted for." },
    { id: "lic_roles", text: "Leader in charge allocates roles to specific adults." },
    { id: "reporting", text: "Everyone understands how and when to record and report incidents." },
    { id: "briefings", text: "Safety is discussed at the start of all events and planning meetings." },
    { id: "guidance", text: "Young people and adults are given appropriate training and rules." },
    { id: "slt_support", text: "Section leadership team supported to gain training/safety knowledge." },
    { id: "inspection", text: "All safety equipment in the meeting place is inspected regularly." }
];

function renderQuestions() {
    const container = document.getElementById('questions-container');
    container.innerHTML = questions.map(q => `
        <div id="card-${q.id}" class="bg-white p-6 rounded-xl shadow border-l-8 border-gray-300">
            <p class="font-bold text-lg mb-3">${q.text}</p>
            <div class="flex gap-4 mb-4">
                <label><input type="radio" name="${q.id}" value="Yes" onchange="toggleBranch('${q.id}', 'Yes')"> Met</label>
                <label><input type="radio" name="${q.id}" value="Partially" onchange="toggleBranch('${q.id}', 'Partially')"> Partially Met</label>
                <label><input type="radio" name="${q.id}" value="No" onchange="toggleBranch('${q.id}', 'No')"> Not Met</label>
            </div>
            <div id="branch-${q.id}" class="hidden space-y-3">
                <textarea id="text-${q.id}" placeholder="Explain the issue..." class="w-full border p-2 rounded"></textarea>
                <input type="date" id="date-${q.id}" class="border p-2 rounded text-sm">
                <p class="text-xs text-gray-400">Target Resolution Date</p>
            </div>
        </div>
    `).join('');
}

window.toggleBranch = (id, val) => {
    const card = document.getElementById(`card-${id}`);
    const branch = document.getElementById(`branch-${id}`);
    if (val === 'Yes') {
        card.className = "bg-white p-6 rounded-xl shadow met-card";
        branch.classList.add('hidden');
    } else {
        card.className = "bg-white p-6 rounded-xl shadow action-card";
        branch.classList.remove('hidden');
    }
};

window.handleLogin = async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        document.getElementById('auth-ui').classList.add('hidden');
        document.getElementById('audit-ui').classList.remove('hidden');
        renderQuestions();
    } catch (e) { alert("Login Error: " + e.message); }
};

window.submitAudit = async () => {
    const responses = {};
    questions.forEach(q => {
        const val = document.querySelector(`input[name="${q.id}"]:checked`)?.value;
        responses[q.id] = {
            status: val || "Unanswered",
            explanation: document.getElementById(`text-${q.id}`).value,
            deadline: document.getElementById(`date-${q.id}`).value
        };
    });

    await setDoc(doc(db, "audits", auth.currentUser.uid), {
        details: {
            name: document.getElementById('name').value,
            district: document.getElementById('district').value,
            group: document.getElementById('group').value,
            section: document.getElementById('section-name').value
        },
        responses: responses,
        timestamp: new Date()
    });
    alert("Audit Submitted Successfully!");
};
