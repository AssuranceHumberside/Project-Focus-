import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// REPLACE WITH YOUR CONFIG FROM STEP 1
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Show/Hide branching fields 
window.toggleBranch = (id, show) => {
    const el = document.getElementById(`${id}-branch`);
    el.style.display = show ? 'block' : 'none';
};

// Handle Saving to Firestore
window.saveAudit = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Please log in first");

    const auditData = {
        userId: user.uid,
        userName: document.getElementById('name').value, [cite: 4]
        group: document.getElementById('group').value, [cite: 7]
        q1_status: document.querySelector('input[name="q1"]:checked')?.value, [cite: 11]
        q1_explanation: document.getElementById('q1-explain').value, [cite: 2]
        q1_resolution_date: document.getElementById('q1-date').value, [cite: 2]
        timestamp: new Date()
    };

    try {
        await setDoc(doc(db, "audits", user.uid), auditData, { merge: true });
        alert("Progress Saved!");
    } catch (e) {
        console.error("Error saving: ", e);
    }
};
