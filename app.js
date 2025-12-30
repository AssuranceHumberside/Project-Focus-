import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    // PASTE YOUR FIREBASE CONFIG HERE FROM PROJECT SETTINGS
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Complete Question List from Source
const questions = [
    { id: "q1", text: "All leaders/helpers have appropriate enquiries (DBS/AAC/Welcome Conversations).", section: "Meetings" },
    { id: "q2", text: "Suitable supervision plan in place for all meetings and visits.", section: "Meetings" },
    { id: "q3", text: "Appropriate InTouch process in place.", section: "Meetings" },
    { id: "q4", text: "All medical and health details available for all people.", section: "Meetings" },
    { id: "q5", text: "Chairs and tables are stored safely.", section: "Meetings" },
    { id: "q6", text: "Tripping or slipping hazards reduced.", section: "Meetings" },
    { id: "q7", text: "Consideration given to overhead hazards and unguarded lights.", section: "Meetings" },
    { id: "q8", text: "Boundaries briefed and understood by young people.", section: "Meetings" },
    { id: "q9", text: "Potential for falls on sharp objects/glass minimised.", section: "Meetings" },
    { id: "q10", text: "Games are age/ability appropriate.", section: "Meetings" },
    { id: "q11", text: "Rules of games are briefed and understood.", section: "Meetings" },
    { id: "q12", text: "Equipment is checked, safe and in good order.", section: "Meetings" },
    { id: "q13", text: "First-aid kit available and accessible at all times.", section: "Meetings" },
    { id: "q14", text: "Emergency plan in place for all meetings/visits.", section: "Meetings" },
    { id: "q15", text: "Identified leader in charge for all events.", section: "Leadership" },
    { id: "q16", text: "Leader ensures all people are accounted for regularly.", section: "Leadership" },
    { id: "q17", text: "Leader allocates specific roles and responsibilities.", section: "Leadership" },
    { id: "q18", text: "Everyone understands how to record/report incidents.", section: "Culture" },
    { id: "q19", text: "Safety discussed at starts of events and planning.", section: "Culture" },
    { id: "q20", text: "Young people/adults given appropriate training/rules.", section: "Culture" },
    { id: "q21", text: "Team supported to gain training and safety knowledge.", section: "Culture" },
    { id: "q22", text: "Safety equipment inspected regularly.", section: "Culture" }
];

// Initialize Audit UI
function renderQuestions() {
    const container = document.getElementById('questions-container');
    container.innerHTML = questions.map(q => `
        <div id="card-${q.id}" class="bg-white p-6 rounded-lg shadow transition-all border-l-8 border-gray-300">
            <p class="font-bold text-lg mb-3">${q.text}</p>
            <div class="flex gap-6 mb-4">
                <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="${q.id}" value="Yes" onchange="updateUI('${q.id}', 'Yes')"> Met
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="${q.id}" value="Partially" onchange="updateUI('${q.id}', 'Partially')"> Partially Met
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="${q.id}" value="No" onchange="updateUI('${q.id}', 'No')"> Not Met
                </label>
            </div>
            <div id="extra-${q.id}" class="hidden space-y-2">
                <textarea id="desc-${q.id}" placeholder="Explain why this is not fully met..." class="w-full border p-2 rounded"></textarea>
                <input type="date" id="date-${q.id}" class="border p-2 rounded">
                <span class="text-xs text-gray-500 block">Expected Resolution Date</span>
            </div>
        </div>
    `).join('');
}

// Handle Branching and Archiving Logic
window.updateUI = (id, value) => {
    const card = document.getElementById(`card-${id}`);
    const extra = document.getElementById(`extra-${id}`);
    
    if (value === 'Yes') {
        card.classList.add('met-archive');
        card.classList.remove('border-red-500');
        card.classList.add('border-green-500');
        extra.classList.add('hidden');
    } else {
        card.classList.remove('met-archive');
        card.classList.remove('border-green-500');
        card.classList.add('border-red-500');
        extra.classList.remove('hidden');
        document.getElementById(`desc-${id}`).required = true;
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
    } catch (e) { alert("Login failed: " + e.message); }
};

window.submitAudit = async () => {
    const results = {};
    questions.forEach(q => {
        const val = document.querySelector(`input[name="${q.id}"]:checked`)?.value;
        results[q.id] = {
            status: val,
            explanation: document.getElementById(`desc-${q.id}`).value,
            deadline: document.getElementById(`date-${q.id}`).value
        };
    });

    await setDoc(doc(db, "audits", auth.currentUser.uid), {
        details: {
            name: document.getElementById('name').value,
            district: document.getElementById('district').value,
            group: document.getElementById('group').value
        },
        responses: results,
        submittedAt: new Date()
    });
    alert("Audit Submitted Successfully!");
};
