import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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

const sections = [
    { title: "Preparation", questions: [
        { id: "q_dbs", text: "Are all DBS and Welcome Conversations complete for the team?" },
        { id: "q_risk", text: "Are written risk assessments shared for every activity?" },
        { id: "q_training", text: "Is all mandatory training (Safety/Safeguarding) up to date?" }
    ]},
    { title: "Meetings", questions: [
        { id: "q12", text: "Is there a clear supervision and ratio plan for all sessions?" },
        { id: "q37", text: "Are accurate headcounts and registers maintained live?" },
        { id: "q31", text: "Is a first-aid kit always accessible to all adults?" }
    ]},
    { title: "Environment", questions: [
        { id: "q20", text: "Are tripping/slipping hazards actively identified and reduced?" },
        { id: "q18", text: "Is equipment stored safely when not in use?" },
        { id: "q30", text: "Is equipment regularly inspected for safe working order?" }
    ]},
    { title: "Culture", questions: [
        { id: "q_dynamic", text: "Do you actively 'check and challenge' safety during meetings?" },
        { id: "q36", text: "Is a specific 'Leader in Charge' clearly identified for every session?" },
        { id: "q43", text: "Is safety a standard talking point in post-activity reviews?" }
    ]}
];

window.toggleAuthMode = () => {
    const title = document.getElementById('auth-title');
    const isLogin = title.innerText === "Welcome Back.";
    title.innerText = isLogin ? "Join Project FOCUS" : "Welcome Back.";
    document.getElementById('register-fields').classList.toggle('hidden');
    document.getElementById('login-btn').classList.toggle('hidden');
    document.getElementById('register-btn').classList.toggle('hidden');
    document.getElementById('toggle-link').innerText = isLogin ? "Already have an account? Sign In" : "Need an account? Register here";
};

window.handleRegister = async () => {
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value;
    const profile = {
        email: email,
        username: email,
        name: document.getElementById('reg-name').value,
        district: document.getElementById('reg-district').value,
        group: document.getElementById('reg-group').value,
        section: document.getElementById('reg-section').value,
        isVerified: false,
        createdAt: new Date().toISOString()
    };

    if (!profile.district || !profile.name) return alert("Please fill in all registration fields.");

    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "users", userCred.user.uid), profile);
        
        // Show the verification success screen
        document.getElementById('auth-card').innerHTML = `
            <div class="text-center animate-fade-in py-10">
                <div class="mb-6 text-emerald-600">
                    <svg class="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h2 class="text-2xl font-black text-[#003945] uppercase italic mb-4">Account Created!</h2>
                <p class="text-slate-600 font-medium mb-6 leading-relaxed">
                    Please bear with us whilst we verify your account! This usually takes up to 48hrs. 
                    Check back soon and try logging in with your email and password set here.
                </p>
                <p class="text-sm text-slate-400">
                    Any issues, contact <a href="mailto:assurance@humbersidescouts.org.uk" class="text-[#003945] font-bold underline">assurance@humbersidescouts.org.uk</a>.
                </p>
                <button onclick="location.reload()" class="mt-8 bg-[#003945] text-white px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs">Return to Login</button>
            </div>
        `;
    } catch (e) { alert("Registration Error: " + e.message); }
};

window.handleLogin = async () => {
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value;
    try {
        const userCred = await signInWithEmailAndPassword(auth, email, pass);
        
        // CRITICAL: Check verification status every login
        const userSnap = await getDoc(doc(db, "users", userCred.user.uid));
        
        if (!userSnap.exists() || !userSnap.data().isVerified) {
            alert("Please bear with us whilst we verify your account! This usually takes up to 48hrs. Check back soon and try logging in with your email and password set here. Any issues, contact assurance@humbersidescouts.org.uk");
            await signOut(auth);
            return;
        }

        profileData = userSnap.data();
        const recordSnap = await getDoc(doc(db, "project_focus_records", userCred.user.uid));
        userProgress = recordSnap.exists() ? recordSnap.data().responses : {};
        
        document.getElementById('auth-ui').classList.add('hidden');
        document.getElementById('audit-ui').classList.remove('hidden');
        document.getElementById('logout-btn').classList.remove('hidden');
        renderStep();
    } catch (e) { alert("Login Error: " + e.message); }
};

window.renderStep = () => {
    const section = sections[currentStep];
    const container = document.getElementById('form-container');
    document.getElementById('section-title').innerText = section.title;

    for(let i=1; i<=4; i++) document.getElementById(`prog-${i}`).classList.toggle('progress-active', i <= currentStep + 1);

    container.innerHTML = section.questions.map(q => {
        const saved = userProgress[q.id] || {};
        return `
            <div class="bg-white p-8 rounded-[1.5rem] shadow-sm border border-slate-100 card-focus ${saved.status === 'Yes' ? 'met-card' : (saved.status ? 'action-card' : '')}">
                <p class="font-bold text-lg text-slate-800 mb-6 leading-tight">${q.text}</p>
                <div class="flex gap-8">
                    ${['Yes', 'Partially', 'No'].map(v => `
                        <label class="flex items-center gap-2 cursor-pointer font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-teal-900 transition-colors">
                            <input type="radio" name="${q.id}" value="${v}" ${saved.status === v ? 'checked' : ''} onchange="saveField('${q.id}', '${v}')"> ${v}
                        </label>
                    `).join('')}
                </div>
            </div>`;
    }).join('');
    
    document.getElementById('prev-btn').classList.toggle('hidden', currentStep === 0);
    document.getElementById('next-btn').classList.toggle('hidden', currentStep === 3);
    document.getElementById('submit-btn').classList.toggle('hidden', currentStep !== 3);
};

window.saveField = async (id, value) => {
    userProgress[id] = { status: value, time: new Date().toISOString() };
    await setDoc(doc(db, "project_focus_records", auth.currentUser.uid), {
        email: profileData.email,
        responses: userProgress,
        userDetails: profileData,
        lastUpdated: new Date().toISOString()
    }, { merge: true });
    renderStep();
};

window.changeSection = (dir) => { currentStep += dir; renderStep(); window.scrollTo({top: 0, behavior: 'smooth'}); };
window.handleLogout = () => { signOut(auth); location.reload(); };
window.finalSubmit = () => { alert("Record Finalized. Thank you."); handleLogout(); };
