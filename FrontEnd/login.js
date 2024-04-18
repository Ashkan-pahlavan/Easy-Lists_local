// Anmeldeformular
document.getElementById('loginForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const UserName = document.getElementById('uname').value;
  const Password = document.getElementById('psw').value;
  
  try {

    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ UserName, Password })
    });

    if (!response.ok) {
      throw new Error(`Anmeldefehler! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.token) {
      alert('Registrierung erfolgreich!');
      localStorage.setItem('UserName', UserName);
      window.location.href = 'app.html';
    } else {
      alert('Anmeldung fehlgeschlagen! Bitte überprüfen Sie Ihre Anmeldeinformationen.');
    }


  } catch (error) {
    console.error('Fehler bei der Anmeldung:', error.message);
    alert('Fehler bei der Anmeldung! Bitte versuchen Sie es später erneut.');
  }
});

  
  // Registrierungsformular
  document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Verhindert das Standardverhalten des Formulars (Neuladen der Seite)
  
    const UserName = document.getElementById('newuname').value;
    const Password = document.getElementById('newpsw').value;
  
    try {

      const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ UserName, Password })
      });
  
      if (!response.ok) {
        throw new Error(`Registrierungsfehler! Status: ${response.status}`);
      }
  
      const data = await response.json();
  
      if (data.message === "Benutzer erfolgreich hinzugef\u00fcgt") {
        alert('Registrierung erfolgreich!');
        localStorage.setItem('UserName', UserName);
        window.location.href = 'app.html';
      } else {
        alert('Registrierung fehlgeschlagen! Bitte überprüfen Sie Ihre Angaben und versuchen Sie es erneut.');
      }
    } catch (error) {
      console.error('Fehler bei der Registrierung:', error.message);
      alert('Fehler bei der Registrierung! Bitte versuchen Sie es später erneut.');
    }
  });
  