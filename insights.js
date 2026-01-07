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
    "q_dbs": "DBS Checks", "q_training": "Mandatory Training", "q_firstaid": "First Aid",
    "q_risk": "Risk Assessments", "q_approval": "Activity Approval", "q14": "InTouch",
    "q_gdpr": "GDPR Compliance", "q_fire": "Fire Safety", "q31": "First Aid Kits"
};

async function generateGraphics() {
    const [auditSnap, userSnap] = await Promise.all([
        getDocs(collection(db, "project_focus_records")),
        getDocs(collection(db, "users"))
    ]);

    const audits = auditSnap.docs.map(d => d.data());
    const users = userSnap.docs.map(d => d.data());

    let redFlags = 0;
    let totalQs = 0;
    let yesCount = 0;
    const riskCounts = {};
    const districtCounts = {};

    audits.forEach(audit => {
        Object.entries(audit.responses || {}).forEach(([qId, val]) => {
            totalQs++;
            if (val.status === "Yes") yesCount++;
            else {
                redFlags++;
                const label = questionMap[qId] || "Other";
                riskCounts[label] = (riskCounts[label] || 0) + 1;
            }
        });

        // Match user for district data
        const profile = users.find(u => u.email === audit.email) || audit.userDetails || {};
        const district = profile.district || "Unassigned";
        districtCounts[district] = (districtCounts[district] || 0) + 1;
    });

    // Update Numerical Stats
    document.getElementById('audit-count').innerText = audits.length;
    document.getElementById('total-issues').innerText = redFlags;
    document.getElementById('county-compliance').innerText = Math.round((yesCount / totalQs) * 100) + "%";

    // Build Risk Heatmap (Bar Chart)
    new Chart(document.getElementById('riskBarChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(riskCounts),
            datasets: [{
                label: 'Red Flags Found',
                data: Object.values(riskCounts),
                backgroundColor: '#ed3f23',
                borderRadius: 8
            }]
        },
        options: { indexAxis: 'y', plugins: { legend: { display: false } } }
    });

    // Build District Participation (Doughnut)
    new Chart(document.getElementById('districtPieChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(districtCounts),
            datasets: [{
                data: Object.values(districtCounts),
                backgroundColor: ['#003945', '#7413dc', '#ffe627', '#008486', '#ed3f23', '#cbd5e1']
            }]
        },
        options: { plugins: { legend: { position: 'bottom' } } }
    });
}

generateGraphics();
