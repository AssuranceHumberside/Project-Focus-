// ... existing initialization code ...

window.showDistrictDetails = (district) => {
    const districtAudits = allData.filter(a => a.responses?.district?.status === district);
    document.getElementById('selected-district-name').innerText = `Review: ${district}`;
    document.getElementById('response-view').classList.remove('hidden');
    
    const tbody = document.getElementById('response-table-body');
    tbody.innerHTML = districtAudits.map(a => {
        let issues = [];
        const res = a.responses || {};
        const history = a.history || {};
        
        for (const [id, val] of Object.entries(res)) {
            const auditHistory = history[id] || [];
            const logs = auditHistory.map(log => `
                <div class="text-[9px] text-slate-400 border-l pl-2 border-slate-200 mt-1">
                    Changed from <b>${log.from}</b> to <b>${log.to}</b> on ${new Date(log.timestamp).toLocaleString()}
                </div>
            `).join('');

            if (val.status === "No" || val.status === "Partially") {
                issues.push(`
                    <div class="mb-4 p-4 bg-red-50 rounded-2xl border-l-4 border-red-600">
                        <div class="text-sm font-bold text-slate-800 mb-1">"${questionMap[id] || id}"</div>
                        <div class="text-xs text-slate-600 italic mb-2">Comment: ${val.explanation || 'None'}</div>
                        <div class="text-[10px] font-black uppercase text-red-600">Current Status: ${val.status} | Log:</div>
                        ${logs || '<span class="text-[9px] text-slate-400 italic">No changes yet</span>'}
                    </div>`);
            } else if (auditHistory.length > 0) {
                // Also show items that were previously "No" but are now "Yes" (Fixed)
                issues.push(`
                    <div class="mb-4 p-4 bg-green-50 rounded-2xl border-l-4 border-emerald-500">
                        <div class="text-sm font-bold text-slate-800 mb-1">"${questionMap[id] || id}"</div>
                        <div class="text-[10px] font-black uppercase text-emerald-600">Fixed & Resolved</div>
                        ${logs}
                    </div>`);
            }
        }

        // ... rest of the table rendering row ...
    }).join('');
};
