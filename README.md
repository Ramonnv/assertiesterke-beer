# 🐻 Sterke Beer: Moedeiland

Een 3D-avonturenspel over weerbaarheid voor kinderen van 8 tot 10 jaar. Je bent een jonge beer op **Moedeiland**,
helpt Juf Uil, Muis, Draak en zelfs Plaagvos, en leert ondertussen hoe je stevig, rustig en snel reageert op plagen.

- **17 hoofdmissies**: elke dag gaat er één nieuwe open
- **Dagelijkse klusjes**: plaagvossen "saai maken", gedachten-bubbels omdraaien, rust bij de vijver
- **30 moedsterren** verstopt op het eiland, en een schatkist
- Na elke missie **kies je een cadeau** met een **superkracht** (superspring, zweven, lantaarn, beer-brul, ...).
  Sommige superkrachten openen nieuwe plekken op het eiland.
- Na elke missie een **missie in het echt**, om samen met papa of mama te doen

## Spelen

- **Web-app:** https://ramonnv.github.io/assertiesterke-beer/ (op de tablet: ⋮ → *Toevoegen aan startscherm*)
- **Android-app:** download de nieuwste **SterkeBeer.apk** onder [Releases](../../releases/latest)

Voortgang wordt op het apparaat bewaard. In het menu → *Ouders* kun je een back-upcode maken.

## Hoe het gebouwd wordt

Bij elke push bouwt **GitHub Actions** alles automatisch:

1. **Blender** (CLI, headless) bouwt de 3D-modellen uit `tools/recipes.mjs` → `web/assets/models/*.glb`
   en rendert met Cycles de portretten en superkracht-iconen (`blender/build_assets.py`).
2. **.NET for Android** verpakt het spel in een APK (zie `MainActivity.cs`) en zet hem bij *Releases*.
3. De web-app wordt gepubliceerd op **GitHub Pages**.

Het spel zelf staat in `web/` (three.js). Lokaal testen: `cd web && python3 -m http.server` en open http://localhost:8000.
Zonder Blender-modellen bouwt de game dezelfde modellen zelf op uit de recepten.
