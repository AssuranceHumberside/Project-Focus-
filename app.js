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
let changeHistory = {}; // New: Tracks timestamps of status changes

const sections = [
    { title: "Identification", questions: [
        { id: "name", type: "text", text: "What is your full name?" },
        { id: "email_contact", type: "text", text: "What is your contact email address?" },
        { id: "district", type: "select", text: "Which District is your section part of?", options: ["Beverley and Hornsea", "Blacktoft Beacon", "City of Hull", "County Section", "Grimsby and Cleethorpes", "North Lincolnshire", "Pocklington", "South Holderness", "Wolds and Coast"] },
        { id: "group", type: "text", text: "Which Scout Group do you belong to?" },
        { id: "section_type", type: "text", text: "Which specific section (e.g., Beavers, Cubs) are you auditing?" }
    ]},
    { title: "Preparation and Planning", questions: [
        { id: "q_dbs", text: "Can you confirm every leader and adult helper regularly attending has completed DBS, AAC, and Welcome Conversations?" },
        { id: "q_risk", text: "Is a written risk assessment produced for every activity, and is it shared with all adults involved?" },
        { id: "q_training", text: "Has every member of the section leadership team completed their mandatory safety and safeguarding training?" },
        { id: "q_approval", text: "For all activities held away from your regular meeting place, do you ensure they are approved by the relevant Lead Volunteer?" },
        { id: "q14", text: "Is a robust InTouch process active and communicated for every meeting and trip?" },
        { id: "q_yellow", text: "Does every adult volunteer have access to the Yellow Card and understand their safeguarding responsibilities?" }
    ]},
    { title: "Section Meetings & Activities", questions: [
        { id: "q12", text: "Do you have a clear supervision plan that covers structured activities, 'free time,' and adult-to-young person ratios?" },
        { id: "q37", text: "Does the Leader in Charge perform regular headcounts or maintain an accurate register to account for everyone?" },
        { id: "q16", text: "Are up-to-date medical and health details for all (including adults) immediately accessible during all activities?" },
        { id: "q33", text: "Do you have a clear plan for how to handle an emergency, and do all adults know their specific role within it?" },
        { id: "q31", text: "Is a fully-stocked first-aid kit available and easily accessible to all leaders at all times?" },
        { id: "q42", text: "Does every adult understand how and when to record and report accidents, near-misses, or 'minor' injuries?" }
    ]},
    { title: "The Physical Environment", questions: [
        { id: "q20", text: "Have all practical steps been taken to identify and reduce tripping or slipping hazards in your meeting place?" },
        { id: "q18", text: "Are all chairs, tables, and equipment stored safely and securely when not in use to prevent injury?" },
        { id: "q25", text: "Has the potential for falls onto sharp objects, solid surfaces, or glass been minimised as far as is practically possible?" },
        { id: "q22", text: "Do you regularly check for overhead hazards and ensure that all lights are appropriately guarded?" },
        { id: "q23", text: "Are clear boundaries and activity limits briefed to and understood by all young people at the start of every meeting?" },
        { id: "q30", text: "Is all equipment used by the section regularly inspected to ensure it is safe and in good working order?" }
    ]},
    { title: "Program & Culture", questions: [
        { id: "q27", text: "Are all games and activities chosen specifically to be suitable for the age and ability of participants?" },
        { id: "q28", text: "Are the rules of every game clearly briefed and understood by both participants and leaders before play begins?" },
        { id: "q_dynamic", text: "Do you actively 'check and challenge' safety throughout a meeting, stopping activities if risks change?" },
        { id: "q36", text: "Is a specific 'Leader in Charge' clearly identified and known to all adults and young people for every session?" },
        { id: "q39", text: "Does the Leader in Charge assign specific responsibilities to other adults to ensure adequate oversight?" },
        { id: "q43", text: "Is safety a standard talking point at the start of all events, during camp planning, and in post-activity reviews?" },
        { id: "q49", text: "Is all safety-specific equipment in the meeting place inspected on a regular, scheduled basis?" }
    ]}
];

window.handleLogin = async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try {
        const userCred = await signInWithEmailAndPassword(auth, email, pass);
        const docSnap = await getDoc(doc(db, "project_focus_records", userCred.user.uid));
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            userProgress = data.responses || {};
            changeHistory = data.history || {};
            
            // returning user logic: start at first section with unresolved issues
            currentStep = findFirstUnresolvedSection();
        }
        
        document.getElementById('auth-ui').classList.add('hidden');
        document.getElementById('audit-ui').classList.remove('hidden');
        document.getElementById('progress-container').classList.remove('hidden');
        renderStep();
    } catch (e) { alert("Login Error: " + e.message); }
};

function findFirstUnresolvedSection() {
    for (let i = 0; i < sections.length; i++) {
        const hasIssue = sections[i].questions.some(q => 
            userProgress[q.id] && (userProgress[q.id].status === 'No' || userProgress[q.id].status === 'Partially')
        );
        if (hasIssue) return i;
    }
    return 0;
}

window.renderStep = () => {
    const section = sections[currentStep];
    const container = document.getElementById('form-container');
    document.getElementById('section-title').innerText = section.title;
    document.getElementById('current-step-label').innerText = currentStep + 1;

    for(let i=1; i<=5; i++) {
        const pill = document.getElementById(`prog-${i}`);
        pill.classList.toggle('progress-active', i <= currentStep + 1);
    }

    // Split questions into Priority (Gaps) and Completed (Met)
    const priorityQs = section.questions.filter(q => 
        userProgress[q.id] && (userProgress[q.id].status === 'No' || userProgress[q.id].status === 'Partially')
    );
    const resolvedQs = section.questions.filter(q => 
        !userProgress[q.id] || userProgress[q.id].status === 'Yes' || q.type === 'text' || q.type === 'select'
    );

    let htmlContent = priorityQs.map(q => renderAuditQuestion(q, userProgress[q.id], true)).join('');
    
    if (resolvedQs.length > 0) {
        htmlContent += `
            <details class="group mt-10">
                <summary class="list-none cursor-pointer bg-slate-100 p-4 rounded-2xl font-bold text-slate-500 uppercase tracking-widest text-xs flex justify-between items-center group-open:bg-teal-50 group-open:text-teal-900 transition-all">
                    <span>Resolved or Basic Details (${resolvedQs.length})</span>
                    <span class="transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div class="mt-4 grid gap-6">
                    ${resolvedQs.map(q => {
                        const saved = userProgress[q.id] || {};
                        if (q.type === 'text') return renderTextField(q, saved);
                        if (q.type === 'select') return renderSelectField(q, saved);
                        return renderAuditQuestion(q, saved, false);
                    }).join('')}
                </div>
            </details>
        `;
    }

    container.innerHTML = htmlContent;
    document.getElementById('prev-btn').classList.toggle('hidden', currentStep === 0);
    document.getElementById('next-btn').classList.toggle('hidden', currentStep === 4);
    document.getElementById('submit-btn').classList.toggle('hidden', currentStep !== 4);
};

window.saveField = async (id, value, type = 'status') => {
    if (!userProgress[id]) userProgress[id] = {};
    
    // New: Track status changes and timestamps
    if (type === 'status' && userProgress[id].status !== value) {
        if (!changeHistory[id]) changeHistory[id] = [];
        changeHistory[id].push({
            from: userProgress[id].status || 'Unset',
            to: value,
            timestamp: new Date().toISOString()
        });
        userProgress[id].status = value;
    } else if (type === 'explanation') {
        userProgress[id].explanation = value;
    } else if (type === 'deadline') {
        userProgress[id].deadline = value;
    } else if (type === 'status') {
        userProgress[id].status = value;
    }

    await setDoc(doc(db, "project_focus_records", auth.currentUser.uid), {
        responses: userProgress,
        history: changeHistory,
        lastUpdated: new Date().toISOString()
    }, { merge: true });
};

function renderAuditQuestion(q, saved, isPriority) {
    const cardStatus = saved.status === 'Yes' ? 'met-card' : (saved.status ? 'action-card' : '');
    const priorityBadge = isPriority ? `<span class="bg-red-600 text-white px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter mb-2 inline-block">Unresolved Action</span>` : '';
    
    return `
        <div class="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 card-focus ${cardStatus}">
            ${priorityBadge}
            <p class="font-bold text-lg text-slate-800 mb-6 leading-snug">${q.text}</p>
            <div class="flex flex-wrap gap-8">
                ${['Yes', 'Partially', 'No'].map(v => `
                    <label class="flex items-center gap-3 cursor-pointer group">
                        <input type="radio" name="${q.id}" value="${v}" ${saved.status === v ? 'checked' : ''} 
                        onchange="saveField('${q.id}', '${v}', 'status'); renderStep();">
                        <span class="text-sm font-bold uppercase tracking-widest text-slate-500 group-hover:text-teal-900 transition-colors">${v}</span>
                    </label>
                `).join('')}
            </div>
            <div class="${(saved.status === 'Partially' || saved.status === 'No') ? '' : 'hidden'} mt-6 pt-6 border-t border-slate-100 space-y-4">
                <textarea placeholder="Action plan..." onchange="saveField('${q.id}', this.value, 'explanation')" class="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm focus:ring-2 focus:ring-red-200 outline-none transition-all">${saved.explanation || ''}</textarea>
                <input type="date" value="${saved.deadline || ''}" onchange="saveField('${q.id}', this.value, 'deadline')" class="bg-slate-50 border-none p-2 px-4 rounded-xl text-sm focus:ring-2 focus:ring-red-200 outline-none">
            </div>
        </div>
    `;
}

function renderTextField(q, saved) {
    return `<div class="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 card-focus met-card"><label class="block font-bold text-slate-800 mb-4">${q.text}</label><input type="text" value="${saved.status || ''}" onchange="saveField('${q.id}', this.value)" class="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm focus:ring-2 focus:ring-teal-700 outline-none transition-all"></div>`;
}

function renderSelectField(q, saved) {
    return `<div class="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 card-focus met-card"><label class="block font-bold text-slate-800 mb-4">${q.text}</label><select onchange="saveField('${q.id}', this.value)" class="w-full bg-slate-50 border-none p-4 rounded-2xl text-sm focus:ring-2 focus:ring-teal-700 outline-none transition-all"><option value="">Select...</option>${q.options.map(o => `<option value="${o}" ${saved.status === o ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`;
}

window.changeSection = (dir) => {
    currentStep += dir;
    renderStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.handleLogout = async () => { await signOut(auth); location.reload(); };
window.finalSubmit = () => { alert("Audit updated and saved. Thank you."); handleLogout(); };
