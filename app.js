import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCtLq8oOWyKb_R8Eff86G4XG54xP49uFyg",
  authDomain: "project-focus-2.firebaseapp.com",
  projectId: "project-focus-2",
  storageBucket: "project-focus-2.firebasestorage.app",
  messagingSenderId: "442223918612",
  appId: "1:442223918612:web:45b50f767725d7adc2b101"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const questions = [
    { id: "q1", text: "Leaders/helpers have appropriate enquiries (DBS/AAC)." },
    { id: "q2", text: "Suitable supervision plan in place for all meetings/visits." },
    { id: "q3", text: "Appropriate InTouch process in place." },
    { id: "q4", text: "Medical/health details available for all people." },
    { id: "q5", text: "Chairs and tables are stored safely." },
    { id: "q6", text: "Tripping or slipping hazards have been reduced." },
    { id: "q7", text: "Consideration given to overhead hazards/unguarded lights." },
    { id: "q8", text: "Boundaries briefed and understood by young people." },
    { id: "q9", text: "Potential for falls on sharp objects/glass minimised." },
    { id: "q10", text: "All games played are suitable for age and ability." },
    { id: "q11", text: "Rules of all games are briefed and understood." },
    { id: "q12", text: "All equipment used is checked, safe and in good order." },
    { id: "q13", text: "First-aid kit available and accessible at all times." },
    { id: "q14", text: "Plan for what to do in an emergency is in place." },
    { id: "q15", text: "Identified leader in charge for all meetings/activities." },
    { id: "q16", text: "Leader in charge accounts for all people regularly." },
    { id: "q17", text: "Leader allocates roles and responsibilities to adults." },
    { id: "q18", text: "Everyone understands how to record/report incidents." },
    { id: "q19", text: "Safety discussed at start of events and planning." },
    { id: "q20", text: "Appropriate training/rules given for activities." },
    { id: "q21", text: "Leadership team supported to gain safety knowledge." },
    { id: "q22", text: "Safety equipment in the meeting place inspected regularly." }
];

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

window.submitAudit = async () => {
    const district = document.getElementById('district').value;
    if (!district) return alert("Select a District!");

    const results = {};
    questions.forEach(q => {
        const val = document.querySelector(`input[name="${q.id}"]:checked`)?.value;
        results[q.id] = {
            status: val || "Unanswered",
            explanation: document.getElementById(`text-${q.id}`).value,
            deadline: document.getElementById(`date-${q.id}`).value
        };
    });

    try {
        await setDoc(doc(db, "sectional_audits", auth.currentUser.uid), {
            details: {
                name: document.getElementById('name').value,
                district: district,
                group: document.getElementById('group').value,
                section: document.getElementById('section-name').value
            },
            responses: results,
            submittedAt: new Date().toISOString()
        });
        alert("Audit Submitted Successfully!");
    } catch (e) { alert("Error: " + e.message); }
};
