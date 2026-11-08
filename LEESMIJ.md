# Sterke Beer: weerbaarheidsspel voor Android

Een speels spel (17 levels) voor kinderen van ongeveer 8 tot 10 jaar. Elke dag gaat er één nieuw level open.
Het spel zelf staat in `Assets/index.html`. De Android-app is een klein .NET-project dat dit spel in een volledig scherm laat zien.

## Eenmalig installeren op je Mac

1. **.NET SDK** (8 of nieuwer): https://dotnet.microsoft.com/download
   Controleer daarna in Terminal: `dotnet --version`
2. **Java (JDK 17)**: `brew install --cask microsoft-openjdk@17`
   (of download hem op https://learn.microsoft.com/java/openjdk/download)
3. **Android-onderdelen voor .NET**:
   ```
   sudo dotnet workload install android
   ```
4. **Android SDK**: de makkelijkste manier is **Android Studio** installeren (https://developer.android.com/studio)
   en hem één keer openen. Dan wordt de SDK neergezet in `~/Library/Android/sdk`.
   Je kunt ook dit gebruiken (werkt zonder Android Studio):
   ```
   dotnet build -t:InstallAndroidDependencies -f net10.0-android "-p:AndroidSdkDirectory=$HOME/Library/Android/sdk" -p:AcceptAndroidSDKLicenses=True
   ```
5. In **VS Code**: installeer de extensie **.NET MAUI** (of **C# Dev Kit**). Dat is handig, maar niet verplicht: bouwen kan ook gewoon in de terminal.

> Heb je .NET 9 of 10? Verander dan in `SterkeBeer.csproj` de regel `net10.0-android` in `net9.0-android` of `net10.0-android`.

## De APK bouwen

Open de map `SterkeBeer` in VS Code, open de terminal (Ctrl+`) en typ:

```
dotnet publish -f net10.0-android -c Release
```

De APK staat daarna in:

```
bin/Release/net10.0-android/publish/nl.sterkebeer.spel-Signed.apk
```

## Op de tablet zetten

**Optie A: via een USB-kabel**
1. Zet op de tablet *Ontwikkelaarsopties* aan: Instellingen → Over tablet → tik 7× op *Buildnummer*.
2. Zet *USB-foutopsporing* aan.
3. Sluit de tablet aan en typ:
   ```
   ~/Library/Android/sdk/platform-tools/adb install -r bin/Release/net10.0-android/publish/nl.sterkebeer.spel-Signed.apk
   ```

**Optie B: zonder kabel**
Zet de `.apk` in Google Drive, mail hem naar jezelf of gebruik Quick Share. Open hem op de tablet en sta
*installeren uit onbekende bronnen* toe als de tablet daarom vraagt.

## Het spel aanpassen

Alle teksten, situaties en levels staan bovenin `Assets/index.html` (zoek naar `const SC`, `const FL` en `const LEVELS`).
Pas ze aan en bouw opnieuw. Testen kan ook gewoon door `index.html` te openen in Chrome op je Mac.

**Ouderhoek** (⚙️ in het spel, na een rekensom): uitleg, alle levels openzetten, naam wijzigen of opnieuw beginnen.
