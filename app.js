// Inside your handleRegister function in app.js
window.handleRegister = async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    
    // Capture profile data including the email as a searchable username field
    const profile = {
        email: email, // Saved explicitly to be pulled into the Admin Dash
        username: email, // Logged as username for redundancy
        name: document.getElementById('reg-name').value,
        district: document.getElementById('reg-district').value,
        group: document.getElementById('reg-group').value,
        section: document.getElementById('reg-section').value,
        isVerified: false,
        createdAt: new Date().toISOString()
    };

    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, pass);
        
        // 1. Log the profile in the 'users' collection
        await setDoc(doc(db, "users", userCred.user.uid), profile);
        
        // 2. Initialize the audit record with the email logged at the top level
        await setDoc(doc(db, "project_focus_records", userCred.user.uid), {
            email: email, // Pre-logged for the Admin Grid
            userDetails: profile,
            responses: {},
            lastUpdated: new Date().toISOString()
        });
        
        // Show verification message...
    } catch (e) { alert(e.message); }
};
