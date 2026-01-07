import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCtLq0oOWyKb_R8Eff86G4XG54xP49uFyg",
    authDomain: "project-focus-2.firebaseapp.com",
    projectId: "project-focus-2",
    storageBucket: "project-focus-2.firebasestorage.app",
    messagingSenderId: "442223918612",
    appId: "1:442223918612:web:45b50f767725d7adc2b101"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const questionMap = {
    "q_dbs": "DBS & Training", "q_training": "Mandatory Training", "q_firstaid": "First Aid",
    "q_risk": "Risk Assessments", "q_approval": "Activity Approval", "q14": "InTouch",
    "q_gdpr": "Data/GDPR", "q_fire": "Fire Safety", "q31": "First Aid Kits"
};

async function loadInsights() {
    const [auditSnap, userSnap] = await Promise.all([
        getDocs(collection(db, "project_focus_records")),
        getDocs(collection(db, "users"))
    ]);

    const audits = auditSnap.docs.map(d => d.data());
    const users = userSnap.docs.map(d => d.data());

    // 1. Calculate Summary Stats
    let totalRedFlags = 0;
    let totalQuestions = 0;
    let yesAnswers = 0;
    const riskData = {};
    const districtData = {};

    audits.forEach(a => {
        Object.entries(a.responses || {}).forEach(([qId, val]) => {
            totalQuestions++;
            if (val.status === "Yes") yesAnswers++;
            else {
                totalRedFlags++;
                const label = questionMap[qId] || "Other";
                riskData[label] = (riskData[label] || 0) + 1;
            }
        });

        const profile = users.find(u => u.email === a.email) || a.userDetails || {};
        const district = profile.district || "Unknown";
        districtData[district] = (districtData[district] || 0) + 1;
    });

    // 2. Update UI Stats
    document.getElementById('stat-total-audits').innerText = audits.length;
    document.getElementById('stat-red-flags').innerText = totalRedFlags;
    document.getElementById('stat-compliance').innerText = 
        totalQuestions > 0 ? Math.round((yesAnswers / totalQuestions) * 100) + "%" : "0%";

    // 3. Render Bar Chart (Safety Risks)
    new Chart(document.getElementById('riskChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(riskData),
            datasets: [{
                label: 'Gaps Found',
                data: Object.values(riskData),
                backgroundColor: '#ed3f23',
                borderRadius: 10
            }]
        },
        options: { indexAxis: 'y', plugins: { legend: { display: false } } }
    });

    // 4. Render Pie Chart (District Engagement)
    new Chart(document.getElementById('districtChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(districtData),
            datasets: [{
                data: Object.values(districtData),
                backgroundColor: ['#003945', '#7413dc', '#ffe627', '#008486', '#ed3f23', '#cbd5e1']
            }]
        },
        options: { plugins: { legend: { position: 'bottom' } } }
    });

    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('insights-ui').classList.remove('hidden');
}

loadInsights();
