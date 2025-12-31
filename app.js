import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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
let profileData = {};
let auditTrail = {};

const sections = [
    { title: "People & Training", questions: [
        { id: "q_dbs", text: "Are all DBS, AAC, and Welcome Conversations complete for the team?" },
        { id: "q_training", text: "Has every leader completed mandatory safety and safeguarding training?" },
        { id: "q_firstaid", text: "Is there at least one adult with a valid First Aid certificate present at every meeting?" },
        { id: "q_yl", text: "Do Young Leaders receive a proper induction and follow the YL training scheme?" },
        { id: "q_yellow", text: "Does every adult volunteer have access to and understand the Yellow Card?" },
        { id: "q_adult_ratio", text: "Are adult-to-young-person ratios always met or exceeded for your section?" },
        { id: "q_helper_dbs", text: "Do all regular parent helpers and non-members have a valid DBS check?" }
    ]},
    { title: "Planning & Approvals", questions: [
        { id: "q_risk", text: "Is a written risk assessment produced for every activity and shared with all adults?" },
        { id: "q_approval", text: "Are all activities away from your regular venue approved by the Lead Volunteer?" },
        { id: "q14", text: "Is a robust InTouch process communicated for every meeting and trip?" },
        { id: "q_nightsaway", text: "For overnight events, is a Nights Away Permit holder always in charge?" },
        { id: "q_permits", text: "Are Adventurous Activity Permits checked and valid before high-risk activities?" },
        { id: "q_gdpr", text: "Is personal data stored securely and disposed of correctly?" },
        { id: "q_inclusion", text: "Are reasonable adjustments made to ensure the program is inclusive for all members?" }
    ]},
    { title: "Section Meetings", questions: [
        { id: "q37", text: "Does the Leader in Charge maintain an accurate register and perform headcounts?" },
        { id: "q16", text: "Are up-to-date medical and health details immediately accessible during activities?" },
        { id: "q33", text: "Do you have a clear emergency plan, and do all adults know their specific roles?" },
        { id: "q31", text: "Is a fully-stocked first-aid kit available and easily accessible at all times?" },
        { id: "q42", text: "Does every adult understand how to record and report accidents or near-misses?" },
        { id: "q_supervision", text: "Is there effective supervision during 'free time' and structured activities?" },
        { id: "q_intouch_test", text: "Do you periodically test your InTouch system to ensure it works in an emergency?" }
    ]},
    { title: "The Environment", questions: [
        { id: "q20", text: "Have all practical steps been taken to reduce tripping or slipping hazards?" },
        { id: "q18", text: "Are chairs, tables, and equipment stored safely and securely when not in use?" },
        { id: "q25", text: "Has the potential for falls onto sharp objects or hard surfaces been minimised?" },
        { id: "q22", text: "Do you check for overhead hazards and ensure lights are appropriately guarded?" },
        { id: "q30", text: "Is all equipment regularly inspected to ensure it is safe and in good order?" },
        { id: "q_fire", text: "Are you aware of the fire exit locations and the evacuation plan for your venue?" },
        { id: "q_hygiene", text: "Are handwashing facilities or sanitiser available, especially before food or games?" }
    ]},
    { title: "Program & Culture", questions: [
        { id: "q27", text: "Are all games and activities suitable for the age and ability of your participants?" },
        { id: "q28", text: "Are the rules of every game clearly briefed and understood before play begins?" },
        { id: "q_dynamic", text: "Do you actively 'check and challenge' safety throughout the session?" },
        { id: "q36", text: "Is a specific 'Leader in Charge' clearly identified to everyone for every session?" },
        { id: "q39", text: "Does the Leader in Charge assign specific oversight responsibilities to other adults?" },
        { id: "q43", text: "Is safety a standard talking point in your team's planning and reviews?" },
        { id: "q49", text: "Is all safety-specific equipment at the venue inspected on a regular basis?" }
    ]}
];

// Attach functions to window to ensure HTML accessibility
window.renderStep = () => {
    const section = sections[currentStep];
    const formContainer = document.getElementById('form-container');
    const metContainer = document.getElementById('met-container');
    const metDropdown = document.getElementById('met-dropdown');
    
    document.getElementById('section-title').innerText = section.title;
    for(let i=1; i<=5; i++) {
        const pill = document.getElementById(`prog-${i}`);
        if(pill) pill.classList.toggle('progress-active', i <= currentStep + 1);
    }

    formContainer.innerHTML = "";
    metContainer.innerHTML = "";
    let metCount = 0;

    section.questions.forEach(q => {
        const saved = userProgress[q.id] || {};
        const isMet = saved.status === 'Yes';
        const isIssue = saved.status === 'Partially' || saved.status === 'No';
        
        const html = `
            <div class="bg-white p-8 card-focus ${isMet ? 'met-card' : (saved.status ? 'action-card' : '')}">
                <p class="font-bold text-lg text-slate-800 mb-6 leading-tight">${q.text}</p>
                <div class="flex gap-8">
                    ${['Yes', 'Partially', 'No'].map(v => `
                        <label class="flex items-center gap-2 cursor-pointer font-black text-[10px] uppercase text-slate-400">
                            <input type="radio" name="${q.id}" value="${v}" ${saved.status === v ? 'checked' : ''} onchange="saveField('${q.id}', '${v}', 'status')"> ${v}
                        </label>
                    `).join('')}
                </div>
                <div class="${isIssue ? '' : 'hidden'} mt-6 pt-6 border-t border-slate-100 space-y-4">
                    <textarea placeholder="Describe action plan..." onchange="saveField('${q.id}', this.value, 'explanation')" class="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm outline-none">${saved.explanation || ''}</textarea>
                    <div class="flex items-center gap-4">
                        <span class="text-xs font-bold text-slate-500 uppercase text-[9px]">Target Date:</span>
                        <input type="date" value="${saved.deadline || ''}" onchange="saveField('${q.id}', this.value, 'deadline')" class="bg-slate-50 border-none p-2 px-4 rounded-xl text-xs font-bold text-slate-600 outline-none">
                    </div>
                </div>
            </div>`;

        if (isMet) { metContainer.innerHTML += html; metCount++; } 
        else { formContainer.innerHTML += html; }
    });

    metDropdown.classList.toggle('hidden', metCount === 0);
    document.getElementById('prev-btn').classList.toggle('hidden', currentStep === 0);
    document.getElementById('next-btn').classList.toggle('hidden', currentStep === 4);
    document.getElementById('submit-btn').classList.toggle('hidden', currentStep !== 4);
};

window.handleLogin = async () => {
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value;
    try {
        const userCred = await signInWithEmailAndPassword(auth, email, pass);
        const userSnap = await getDoc(doc(db, "users", userCred.user.uid));
        
        if (!userSnap.exists() || !userSnap.data().isVerified) {
            alert("Verification Pending.");
            await signOut(auth);
            return;
        }

        profileData = userSnap.data();
        const recordSnap = await getDoc(doc(db, "project_focus_records", userCred.user.uid));
        if (recordSnap.exists()) {
            const data = recordSnap.data();
            userProgress = data.responses || {};
            auditTrail = data.trail || {};
            currentStep = data.lastStep || 0;
        }
        
        document.getElementById('auth-ui').classList.add('hidden');
        document.getElementById('audit-ui').classList.remove('hidden');
        document.getElementById('logout-btn').classList.remove('hidden');
        renderStep();
    } catch (e) { alert("Login Error: " + e.message); }
};

window.saveField = async (id, value, type = 'status') => {
    if (!userProgress[id]) userProgress[id] = {};
    if (type === 'status' && value === 'Yes' && userProgress[id].status && userProgress[id].status !== 'Yes') {
        if (!auditTrail[id]) auditTrail[id] = [];
        auditTrail[id].push({ from: userProgress[id].status, to: 'Yes', date: new Date().toISOString() });
    }
    userProgress[id][type] = value;
    await setDoc(doc(db, "project_focus_records", auth.currentUser.uid), {
        email: profileData.email,
        responses: userProgress,
        trail: auditTrail,
        userDetails: profileData,
        lastStep: currentStep,
        lastUpdated: new Date().toISOString()
    }, { merge: true });
    if (type === 'status') renderStep();
};

window.changeSection = (dir) => { currentStep += dir; renderStep(); window.scrollTo({top: 0, behavior: 'smooth'}); };
window.handleLogout = () => { signOut(auth); location.reload(); };
window.toggleAuthMode = () => {
    const isLogin = document.getElementById('auth-title').innerText === "Volunteer Portal";
    document.getElementById('auth-title').innerText = isLogin ? "Join Project FOCUS" : "Volunteer Portal";
    document.getElementById('register-fields').classList.toggle('hidden');
    document.getElementById('login-btn').classList.toggle('hidden');
    document.getElementById('register-btn').classList.toggle('hidden');
    document.getElementById('toggle-link').innerText = isLogin ? "Already have an account? Sign In" : "Need an account? Register here";
};
window.handleRegister = async () => {
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value;
    const profile = {
        email: email, name: document.getElementById('reg-name').value,
        district: document.getElementById('reg-district').value,
        group: document.getElementById('reg-group').value, section: document.getElementById('reg-section').value,
        isVerified: false, createdAt: new Date().toISOString()
    };
    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "users", userCred.user.uid), profile);
        alert("Success! Awaiting verification."); location.reload();
    } catch (e) { alert(e.message); }
};
