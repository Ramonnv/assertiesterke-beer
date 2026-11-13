/**
 * Sterke Beer: mail-koppeling voor het ouderrapport.
 * Plak dit in een nieuw Google Apps Script-project (script.google.com) en publiceer het als web-app.
 * Zie MAIL-KOPPELING.md voor de stappen.
 *
 * Alleen adressen in TOEGESTAAN krijgen mail, zodat niemand anders jouw koppeling kan misbruiken.
 */
const TOEGESTAAN = [
  'jouw.adres@voorbeeld.nl'   // <-- vervang door je eigen e-mailadres (meerdere mag, met komma's)
];

function doPost(e) {
  try {
    const m = JSON.parse(e.postData.contents);
    const to = String(m.to || '').trim().toLowerCase();
    if (!TOEGESTAAN.map(a => a.toLowerCase()).includes(to)) return antwoord('niet toegestaan');
    MailApp.sendEmail({
      to: to,
      subject: String(m.subject || 'Sterke Beer').slice(0, 200),
      body: String(m.text || '').slice(0, 20000),
      htmlBody: String(m.html || '').slice(0, 200000),
      name: 'Sterke Beer'
    });
    return antwoord('ok');
  } catch (err) {
    return antwoord('fout: ' + err);
  }
}

function doGet() { return antwoord('Sterke Beer mail-koppeling werkt.'); }

// Draai deze één keer met de ▶-knop om toestemming te geven en een testmail te krijgen.
function test() {
  MailApp.sendEmail(TOEGESTAAN[0], 'Sterke Beer: test', 'De mail-koppeling werkt! 🐻');
}

function antwoord(t) { return ContentService.createTextOutput(t); }
