# Ondertekensleutel

`sterkebeer.keystore` ondertekent de APK. Doordat elke build dezelfde sleutel gebruikt, kan een nieuwe versie over de bestaande app heen worden geïnstalleerd (met de update-knop in de Ouderhoek), zonder dat de voortgang verloren gaat.

Het wachtwoord staat in `.github/workflows/build.yml`. Let op: deze repo is openbaar, dus de sleutel is niet geheim. Wil je dat later wel, zet dan de secrets `ANDROID_KEYSTORE_B64` en `ANDROID_KEY_PASS`; de build gebruikt die dan automatisch.

Verander of verwijder deze sleutel niet: anders past een nieuwe APK niet meer over de geïnstalleerde app.
