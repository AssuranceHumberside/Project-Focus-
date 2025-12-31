// ... (Imports and Auth Monitoring same as previous) ...

async function loadAdminData() {
    const [auditSnap, userSnap] = await Promise.all([
        getDocs(collection(db, "project_focus_records")),
        getDocs(collection(db, "users"))
    ]);
    allAuditData = auditSnap.docs.map(d => ({uid: d.id, ...d.data()}));
    allUserProfiles = userSnap.docs.map(d => ({uid: d.id, ...d.data()}));
    renderGrid();
    renderUserList();
}

window.showDistrictDetails = (district) => {
    const audits = allAuditData.filter(a => {
        const profile = allUserProfiles.find(u => u.uid === a.uid);
        return profile && profile.district === district;
    });

    document.getElementById('selected-district-name').innerText = district;
    document.getElementById('response-view').classList.remove('hidden');
    const tbody = document.getElementById('response-table-body');

    tbody.innerHTML = audits.map(a => {
        const profile = allUserProfiles.find(u => u.uid === a.uid) || {};
        const res = a.responses || {};
        const trail = a.trail || {};
        let issuesHtml = [];

        // Question mapping for the detailed view
        for (const [id, val] of Object.entries(res)) {
            const logs = (trail[id] || []).map(log => `
                <div class="text-[9px] font-black text-emerald-600 uppercase mt-2 border-l-2 border-emerald-500 pl-2">
                    Resolved: ${log.from} → ${log.to} (${new Date(log.date).toLocaleDateString()})
                </div>`).join('');

            if (val.status !== "Yes") {
                issuesHtml.push(`
                    <div class="mb-4 p-5 bg-red-50 rounded-[1.5rem] border-l-4 border-red-500 shadow-sm">
                        <div class="text-[11px] font-black text-slate-800 uppercase mb-2 leading-tight">${id.replace(/_/g, ' ')}</div>
                        <div class="text-[11px] text-slate-600 italic bg-white p-3 rounded-xl border border-red-100 mb-2">${val.explanation || 'No Comment'}</div>
                        <div class="flex gap-2">
                             <span class="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded font-black uppercase">${val.status}</span>
                             <span class="text-[8px] bg-slate-800 text-white px-2 py-0.5 rounded font-black uppercase">Deadline: ${val.deadline || 'TBC'}</span>
                        </div>
                        ${logs}
                    </div>`);
            } else if (trail[id]) {
                issuesHtml.push(`
                    <div class="mb-4 p-5 bg-emerald-50 rounded-[1.5rem] border-l-4 border-emerald-500 shadow-sm opacity-60">
                         <div class="text-[10px] font-black text-slate-400 uppercase leading-tight">${id.replace(/_/g, ' ')}</div>
                         ${logs}
                    </div>`);
            }
        }

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-10 align-top border-r w-1/3">
                    <div class="font-black text-[#003945] text-2xl uppercase italic tracking-tighter leading-none mb-2">${profile.group || 'N/A'}</div>
                    <div class="text-[11px] font-black text-[#7413dc] bg-purple-50 px-3 py-1 rounded-full inline-block uppercase tracking-widest mb-8 border border-purple-100">${profile.section || 'N/A'}</div>
                    <div class="pt-6 border-t border-slate-100">
                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 underline decoration-teal-500">${profile.email || 'Email Missing'}</span>
                        <div class="text-xs font-black text-slate-800 uppercase tracking-tight">${profile.name || 'Anonymous'}</div>
                    </div>
                </td>
                <td class="p-10 align-top">${issuesHtml.length > 0 ? issuesHtml.join('') : '<div class="text-emerald-600 font-black uppercase text-xs tracking-widest italic flex items-center gap-2">✓ Fully Assured & POR Compliant</div>'}</td>
            </tr>`;
    }).join('');
    window.scrollTo({ top: document.getElementById('response-view').offsetTop - 20, behavior: 'smooth' });
};
