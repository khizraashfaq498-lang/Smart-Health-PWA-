document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const signupStep = document.getElementById('signupStep');
    const successStep = document.getElementById('successStep');
    const btnContinue = document.getElementById('btnContinue');

    let createdData = null;

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const emergencyContact = document.getElementById('emergencyContact').value;

        // Create user
        const data = createSenior({
            profile: { name, phone, emergencyContact },
            vitals: [],
            steps: [],
            medications: [],
        });

        createdData = data;

        // Show results
        document.getElementById('resSeniorId').textContent = data.seniorId;
        document.getElementById('resFamilyPass').textContent = data.familyPassword;
        document.getElementById('resDoctorPass').textContent = data.doctorPassword;

        signupStep.classList.add('hidden');
        successStep.classList.remove('hidden');
    });

    btnContinue.addEventListener('click', () => {
        if (createdData) {
            setSession({ seniorId: createdData.seniorId, role: 'senior' });
            window.location.href = 'dashboard.html';
        }
    });
});
