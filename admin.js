import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCtLq8oOWyKb_R8Eff86G4XG54xP49uFyg", //
  authDomain: "project-focus-2.firebaseapp.com", //
  projectId: "project-focus-2", //
  storageBucket: "project-focus-2.firebasestorage.app", //
  messagingSenderId: "442223918612", //
  appId: "1:442223918612:web:45b50f767725d7adc2b101" //
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadAuditData() {
    const tableBody = document.getElementById('admin-table-body');
    const querySnapshot = await getDocs(collection(db, "sectional_audits"));
    
    let total = 0, met = 0, action = 0;

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        total++;
        
        let issues = [];
        // Check all responses for non-'Yes' status
        for (const [qId, res] of Object.entries(data.responses)) {
            if (res.status !== "Yes") {
                issues.push(`<strong>${qId}:</strong> ${res.explanation} (Due: ${res.deadline || 'N/A'})`);
            }
        }

        const isFullyMet = issues.length === 0;
        isFullyMet ? met++ : action++;

        const row = `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-3">
                    <span class="font-bold">${data.details.group}</span><br>
                    <span class="text-sm text-gray-600">${data.details.district} - ${data.details.section}</span>
                </td>
                <td class="p-3">
                    <span class="px-2 py-1 rounded text-xs font-bold ${isFullyMet ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}">
                        ${isFullyMet ? 'ALL MET' : 'ACTION REQUIRED'}
                    </span>
                </td>
                <td class="p-3 text-sm">${isFullyMet ? 'No issues found' : issues.join('<br>')}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });

    document.getElementById('total-count').innerText = total;
    document.getElementById('met-count').innerText = met;
    document.getElementById('action-count').innerText = action;
}

loadAuditData();
