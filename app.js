import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. Connection (Project Focus 2)
const firebaseConfig = {
  apiKey: "AIzaSyCtLq0oOWyKb_R8Eff86G4XG54xP49uFyg",
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

// 2. The Questions (Sections 2, 3, and 4)
const questions = [
    { id: "q1", text: "All leaders/helpers have appropriate enquiries (DBS/AAC/Welcome Conversations)." },
    { id: "q2", text: "Suitable supervision plan in place for all section meetings and visits." },
    { id: "q3", text: "Appropriate InTouch process in place for all section meetings and visits." },
    { id: "q4", text: "All medical and health details are available for all people (including adults)." },
    { id: "q5", text: "Chairs and tables are stored safely in the meeting place." },
    { id: "q6", text: "Tripping or slipping hazards have been reduced, as far as possible." },
    { id: "q7", text: "Consideration given to overhead hazards and unguarded lights." },
    { id: "q8", text: "Boundaries and limits are briefed and understood by all young people." },
    { id: "q9", text: "Potential for falls on solid or sharp objects and glass has been minimised." },
    { id: "q10", text: "All games played are suitable for the age and ability of participants." },
    { id: "q11", text: "Rules of all games played are briefed and understood." },
    { id: "q12", text: "All equipment used by the section is checked, safe and in good order." },
    { id: "q13", text: "There is a first-aid kit available and accessible at all times." },
    { id: "q14", text: "There is a plan for what to do in an emergency." },
    { id: "q15", text: "Identified leader in charge for all meetings, events or activities." },
    { id: "q16", text: "Leader in charge ensures all people are accounted for regularly." },
    { id: "q17", text: "Leader in charge allocates roles to specific adults." },
    { id: "q18", text: "Everyone understands how and when to record and report incidents." },
    { id: "q19", text: "Safety is discussed at the start of all events and planning meetings." },
    { id: "q20", text: "Young people and adults are given appropriate training and rules." },
    { id: "q21", text: "Leadership team supported to gain training/improve safety knowledge." },
    { id: "q22", text: "All safety equipment in the meeting place is inspected regularly." }
];

// 3. Logic to show/hide extra boxes (Branching Logic)
window.toggleBranch = (id, val) => {
    const branch = document.getElementById(`branch-${id}`);
    const card = document.getElementById(`card-${id}`);
    if (val === 'Yes') {
        branch.classList.add('hidden');
        card.style.backgroundColor = "#f0fdf4"; // Light green for 'Met'
    } else {
        branch.classList.remove('hidden');
        card.style.backgroundColor = "#fef2f2"; // Light red for 'Action'
    }
};

// 4. Handle Login
window.handleLogin = async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        document.getElementById('auth-ui').classList.add('hidden');
        document.getElementById('audit-ui').classList.remove('hidden');
        renderQuestions();
    } catch (e) { alert("Login failed: " + e.message); }
};

// 5. Render Questions into HTML
function renderQuestions() {
    const container = document.getElementById('questions-container');
    container.innerHTML = questions.map(q => `
        <div id="card-${q.id}" class="bg-white p-6 rounded-xl shadow border-l-8 border-gray-300 mb-4 transition-all">
            <p class="font-bold text-lg mb-3">${q.text}</p>
            <div class="flex gap-4">
                <label><input type="radio" name="${q.id}" value="Yes" onchange="toggleBranch('${q.id}', 'Yes')"> Met</label>
                <label><input type="radio" name="${q.id}" value="Partially" onchange="toggleBranch('${q.id}', 'Partially')"> Partially Met</label>
                <label><input type="radio" name="${q.id}" value="No" onchange="toggleBranch('${q.id}', 'No')"> Not Met</label>
            </div>
            <div id="branch-${q.id}" class="hidden mt-4 space-y-2">
                <p class="text-sm font-bold text-red-600">Explanation & Target Resolution Date Required:</p>
                <textarea id="text-${q.id}" placeholder="Explain the issue..." class="w-full border p-2 rounded"></textarea>
                <input type="date" id="date-${q.id}" class="border p-2 rounded">
            </div>
        </div>
    `).join('');
}

// 6. Save Audit to Firebase
window.submitAudit = async () => {
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
        await setDoc(doc(db, "audits", auth.currentUser.uid), {
            details: {
                name: document.getElementById('name').value,
                district: document.getElementById('district').value,
                group: document.getElementById('group').value,
                section: document.getElementById('section-name').value
            },
            responses: results,
            submittedAt: new Date()
        });
        alert("Audit Submitted Successfully!");
    } catch (e) { alert("Error: " + e.message); }
};
