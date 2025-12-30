import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// This is the config from your screenshot
const firebaseConfig = {
  apiKey: "AIzaSyB9yv5ZSXFWieC-o9Px2RLOSTgZxtByA44",
  authDomain: "humberside-project-focus.firebaseapp.com",
  projectId: "humberside-project-focus",
  storageBucket: "humberside-project-focus.firebasestorage.app",
  messagingSenderId: "672342241818",
  appId: "1:672342241818:web:d2f0a6afade9b48d5e57a3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Your full question list from Section 2, 3, and 4
const auditQuestions = [
    { id: "q1", text: "Leaders/helpers have appropriate enquiries (DBS/AAC)." }, [cite: 10]
    { id: "q2", text: "Suitable supervision plan for meetings/visits." }, [cite: 12]
    { id: "q3", text: "Appropriate InTouch process in place." }, [cite: 14]
    { id: "q4", text: "Medical/health details available for all people." }, [cite: 16]
    { id: "q5", text: "Chairs and tables stored safely." }, [cite: 18]
    { id: "q6", text: "Tripping or slipping hazards reduced." }, [cite: 20]
    { id: "q7", text: "Emergency plan in place for all meetings/visits." }, [cite: 33]
    { id: "q8", text: "Identified leader in charge for all activities." }, [cite: 36]
    { id: "q9", text: "Understand how to record/report incidents." }, [cite: 42]
    // ... add all other questions here following this pattern
];

// Logic to show text box only if 'No' or 'Partially' is picked [cite: 2]
window.updateBranch = (id, val) => {
    const box = document.getElementById(`extra-${id}`);
    if (val === "No" || val === "Partially") {
        box.classList.remove('hidden');
    } else {
        box.classList.add('hidden');
    }
};
