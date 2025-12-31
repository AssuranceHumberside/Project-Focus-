window.showDistrictDetails = (district) => {
    const auditsInDistrict = allAuditData.filter(audit => {
        const profile = allUserProfiles.find(u => u.uid === audit.uid);
        return profile && profile.district === district;
    });

    const tbody = document.getElementById('response-table-body');
    tbody.innerHTML = auditsInDistrict.map(a => {
        const profile = allUserProfiles.find(u => u.uid === a.uid) || {};
        
        // POSH EMAIL LOOKUP: Pulls from multiple potential log locations
        const displayEmail = a.email || profile.email || profile.username || "Pending Sync...";

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-10 align-top border-r w-1/3">
                    <div class="font-black text-[#003945] text-2xl uppercase italic tracking-tighter mb-2 leading-none">${profile.group || 'New Unit'}</div>
                    <div class="text-[11px] font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-full inline-block uppercase tracking-widest mb-8 border border-purple-100">${profile.section || 'TBC'}</div>
                    
                    <div class="pt-6 border-t border-slate-100 space-y-3">
                        <div>
                            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Contact / Username</span>
                            <div class="text-xs font-black text-teal-700 break-all underline decoration-yellow-400">${displayEmail}</div>
                        </div>
                        <div>
                            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Lead Auditor</span>
                            <div class="text-xs font-black text-slate-800 uppercase tracking-tight">${profile.name || 'Anonymous'}</div>
                        </div>
                    </div>
                </td>
                <td class="p-10 align-top">
                    </td>
            </tr>`;
    }).join('');
};
