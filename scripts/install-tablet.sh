#!/bin/bash
# Zet SterkeBeer.apk op een tablet die met USB is aangesloten.
cd "$(dirname "$0")/.." || exit 1
LOG="$PWD/tablet.log"
exec > >(tee "$LOG") 2>&1
ADB="$HOME/Library/Android/sdk/platform-tools/adb"
if [ ! -x "$ADB" ]; then echo "=== FOUT: adb niet gevonden op $ADB ==="; exit 1; fi
echo "=== Sterke Beer op de tablet zetten $(date) ==="
"$ADB" start-server
echo "Wachten op de tablet (max 2 minuten)..."
echo ">> Kijk op de tablet: tik op 'Toestaan' bij 'USB-foutopsporing toestaan?'"
for i in $(seq 1 60); do
  STATE=$("$ADB" get-state 2>/dev/null)
  [ "$STATE" = "device" ] && break
  "$ADB" devices | grep -q unauthorized && echo "   ...wacht op 'Toestaan' op de tablet"
  sleep 2
done
"$ADB" devices -l
if [ "$("$ADB" get-state 2>/dev/null)" != "device" ]; then
  echo "=== FOUT: geen tablet gevonden. Staat USB-foutopsporing aan en heb je op Toestaan getikt? ==="; exit 1
fi
"$ADB" install -r SterkeBeer.apk && echo && echo "=== KLAAR: Sterke Beer staat op de tablet! ==="
