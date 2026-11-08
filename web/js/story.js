// Het verhaal van Moedeiland: wie geeft welke missie, wat ze zeggen, en de superkrachten.
import { LEVELS } from './content.js';

export const NPCS = {
  uil:   { name: 'Juf Uil',  model: 'uil',   home: [3.5, -6.5],  face: 0.4,  place: 'de Uilenboom op het dorpsplein',
           idle: ['Hoe gaat het met je, {naam}?', 'Een grote mens om hulp vragen is slim én dapper.', 'Ik ben trots op je, weet je dat?'] },
  muis:  { name: 'Muis',     model: 'muis',  home: [-27, 6],     face: 1.2,  place: 'de molen in het westen',
           idle: ['Eh… hoi {naam}. Fijn dat je er bent.', 'Ik oefen mijn beer-stem. Stop! …Was dat goed?', 'Jij bent mijn dapperste vriendin.'] },
  draak: { name: 'Draak',    model: 'draak', home: [1, -31],     face: 0.0,  place: 'de vulkaanheuvel in het noorden',
           idle: ['GRRR… oh, jij bent het. Sorry. Ademen, Draak, ademen.', 'Soms word ik zo boos dat er rook uit mijn neus komt!', 'Jij laat mij zien dat je ook rustig sterk kan zijn.'] },
  vos:   { name: 'Plaagvos', model: 'vos',   home: [31, 8],      face: -1.4, place: 'het Vossenbos in het oosten',
           idle: ['Hihi, wat kom jíj hier doen?', 'Ik plaag alleen maar een beetje… toch?', 'Hm. Jij wordt nooit boos. Dat is saai. En een beetje cool.'] }
};

// Per hoofdmissie: wie, en wat ze zeggen voor en na de opdracht.
export const QUESTS = [
  { npc: 'uil', intro: ['Welkom op Moedeiland, {naam}! Ik ben Juf Uil. 🦉', 'Op dit eiland leer je hoe je sterk wordt vanbinnen. Elke dag een nieuwe missie!', 'Zullen we beginnen met de allerbelangrijkste les?'],
    outro: ['Prachtig gedaan! Je eerste stap als Beer is gezet.', 'Hier, kies maar een cadeau. Elk cadeau geeft je een superkracht!'] },
  { npc: 'uil', intro: ['Goedemorgen {naam}! Vandaag gaan we je lijf gebruiken.', 'Wie stevig staat, voelt zich ook sterker. Doe je mee?'],
    outro: ['Zo sta je als een echte beer! Niemand duwt jou zomaar omver.'] },
  { npc: 'muis', intro: ['O-o-oh, hoi {naam}… ik ben Muis.', 'Ik praat altijd zo zacht… niemand hoort me. Wil jij me helpen met een beer-stem?'],
    outro: ['STOP! …Wauw, dat kwam er echt uit! Dankjewel, {naam}!'] },
  { npc: 'muis', intro: ['Iemand blijft maar aan mijn staart trekken…', 'Kun jij me de Stop-hand leren? ✋'],
    outro: ['Stop-hand omhoog, stevige stem. Ik voel me al veel sterker!'] },
  { npc: 'vos', intro: ['Hé hé, wie hebben we daar? Een klein beertje!', 'Ik ben Plaagvos. Ik ben de snelste plager van het eiland. Kun jij mij bijhouden?'],
    outro: ['Pfff… jij laat je niet uit het veld slaan, hè. Saai hoor. …Maar wel knap.'] },
  { npc: 'draak', intro: ['GRRRR! Oh… sorry. Ik ben Draak.', 'In mijn hoofd zitten allemaal boze, gemene gedachten. Kun jij me helpen ze om te draaien?'],
    outro: ['Het is veel rustiger in mijn hoofd nu. Dankjewel, {naam}. 💚'] },
  { npc: 'vos', intro: ['Hé, wat heb jij een rare oren!', '…Hm, je wordt niet eens boos? Laat me eens zien hoe je dat doet.'],
    outro: ['"Kan zijn." Grr, daar kan ik helemaal niks mee! Jij bent echt te cool.'] },
  { npc: 'vos', intro: ['Mijn vossenvrienden en ik plagen graag. Dat vinden we spannend!', 'Behalve als iemand er helemaal niks van maakt… dan is het saai.'],
    outro: ['Stop – Zeg – Ga. Met jou valt echt niet te sollen. Ik ga wel iets anders doen.'] },
  { npc: 'uil', intro: ['Soms kun je iets niet alleen oplossen, {naam}. Dat geldt voor iedereen, ook voor mij.', 'Vandaag leer je wanneer je een grote mens om hulp vraagt.'],
    outro: ['Onthoud: hulp vragen is geen klikken. Het is dapper. 🦸‍♀️'] },
  { npc: 'muis', intro: ['{naam}… op het schoolplein lachen ze een ander muisje steeds uit.', 'Ik weet niet wat ik moet doen. Help je me?'],
    outro: ['Jij bent sterk voor jezelf én voor een ander. Een echte vriendin!'] },
  { npc: 'draak', intro: ['Ik wil ALTIJD mijn zin. Altijd! Is dat niet sterk?', '…Muis wil niet meer met me spelen. Leg jij het me uit?'],
    outro: ['Om de beurt kiezen… Muis vond het geweldig. En ik eigenlijk ook!'] },
  { npc: 'draak', intro: ['Maar wanneer moet ik dan wél vasthouden? En wanneer meegeven?', 'Mijn grote drakenhoofd snapt het nog niet helemaal.'],
    outro: ['Belangrijk: vasthouden. Klein: meegeven. Dat onthoud ik voor altijd!'] },
  { npc: 'uil', intro: ['Ook op een tablet kun je een Beer zijn, {naam}.', 'Laten we samen de Beer-regels voor online leren. 📱'],
    outro: ['Slim en veilig. Daar word ik als uil heel blij van!'] },
  { npc: 'vos', intro: ['Revanche! Deze keer ben ik nóg sneller!', 'Flitsronde Plus. Ben je er klaar voor?'],
    outro: ['Hoe dóé je dat toch?! Oké oké, jij wint. Weer.'] },
  { npc: 'draak', intro: ['Soms voel ik het vuur in mijn buik weer opkomen…', 'Wil je samen met mij ademen bij de vulkaan?'],
    outro: ['Rustig én sterk. Kijk, er komt helemaal geen rook meer uit mijn neus!'] },
  { npc: 'uil', intro: ['Je hebt al zoveel geleerd, {naam}. Tijd voor de grote training!', 'Alles komt terug, en er loopt een klok. Ik weet zeker dat je het kan.'],
    outro: ['Wat een kanjer ben jij. Nog één missie te gaan…'] },
  { npc: 'uil', intro: ['Dit is het, {naam}. De finale van Moedeiland. 👑', 'Muis, Draak en zelfs Plaagvos zijn komen kijken!'],
    outro: ['Je bent een echte Beer-Legende! Het hele eiland is trots op je. 🎉'] }
];

// Eerste les: in de 3D-wereld ben jij zelf de Beer, Juf Uil vertelt.
LEVELS[0].acts[0].lines[0] = 'Op Moedeiland ben jij een jonge <b>Beer</b>. Beren zijn sterk vanbinnen. 💛';

// Superkrachten. De eerste vier openen nieuwe plekken op het eiland.
export const ITEMS = {
  cape:     { name: 'Kracht-cape',        power: 'Superspring',     desc: 'Spring drie keer zo hoog. Zo kom je op de Hoge Klif!' },
  lantaarn: { name: 'Moed-lantaarn',      power: 'Licht in het donker', desc: 'Je lantaarn verlicht het Schaduwbos. Wat zou daar verstopt zijn?' },
  megafoon: { name: 'Brul-megafoon',      power: 'Beer-brul',       desc: 'Met één stevige BRUL blaas je de mist bij het Mistpad weg.' },
  ballon:   { name: 'Adem-ballon',        power: 'Zweven',          desc: 'Houd springen ingedrukt in de lucht en zweef rustig naar beneden. Ver weg!' },
  laarzen:  { name: 'Stevige Laarzen',    power: 'Sprinten',        desc: 'Duw de joystick helemaal naar de rand en ren zo snel als de wind.' },
  magneet:  { name: 'Sterrenmagneet',     power: 'Magneet',         desc: 'Moedsterren vliegen vanzelf naar je toe.' },
  kristal:  { name: 'Kalmte-kristal',     power: 'Extra tijd',      desc: 'Je krijgt 3 seconden extra bij snelle opdrachten. Rustig blijven!' },
  bril:     { name: 'Coole Zonnebril',    power: 'Dubbele vos-sterren', desc: 'Plaagvos verslaan geeft je dubbel zoveel moedsterren.' },
  armband:  { name: 'Vriendschapsband',   power: 'Muis-maatje',     desc: 'Een klein muisje loopt met je mee en wijst de dichtstbijzijnde moedster aan.' },
  schild:   { name: 'Vertrouwensschild',  power: 'Gedachten-schild', desc: 'Gemene gedachten-bubbels die je omdraait, geven dubbele punten.' },
  hoed:     { name: 'Ontdekkershoed',     power: 'Schattenkaart',   desc: 'Alle moedsterren verschijnen op je kaartje.' },
  rugzak:   { name: 'Sterrenrugzak',      power: 'Dubbele sterren', desc: 'Elke moedster die je vindt telt dubbel.' },
  sjaal:    { name: 'Regenboogsjaal',     power: 'Regenboogspoor',  desc: 'Je laat een regenboog achter je aan en loopt een tikje sneller.' },
  vleugels: { name: 'Vlindervleugels',    power: 'Dubbele sprong',  desc: 'Spring nog een keer terwijl je in de lucht bent!' },
  schelp:   { name: 'Reisschelp',         power: 'Snelreizen',      desc: 'Reis in één tik naar elk huis op het eiland.' },
  fluit:    { name: 'Rustfluit',          power: 'Kalmeermelodie',  desc: 'Speel een rustig deuntje: vossen in de buurt worden even heel lief.' },
  kroon:    { name: 'Gouden Kroon',       power: 'Legende-glans',   desc: 'Al je superkrachten worden sterker. Je bent een Beer-Legende!' }
};
// Volgorde waarin cadeaus worden aangeboden (eerst de krachten die nieuwe plekken openen).
export const ITEM_ORDER = ['cape', 'lantaarn', 'laarzen', 'megafoon', 'ballon', 'magneet', 'vleugels', 'kristal', 'bril', 'armband', 'schelp', 'hoed', 'rugzak', 'schild', 'sjaal', 'fluit'];

export const SHOP = [
  { id: 'bruin',  name: 'Bruine vacht',   price: 0,  fur: '#9a6332', belly: '#e8bf8a' },
  { id: 'ijs',    name: 'IJsbeer',        price: 10, fur: '#f2f4ff', belly: '#ffffff' },
  { id: 'panda',  name: 'Panda',          price: 20, fur: '#f4f4f4', belly: '#2b2b33' },
  { id: 'nacht',  name: 'Nachtbeer',      price: 30, fur: '#3d3a6b', belly: '#9d8cff' },
  { id: 'goud',   name: 'Gouden beer',    price: 45, fur: '#ffc94a', belly: '#fff0b5' },
  { id: 'roze',   name: 'Suikerspin',     price: 60, fur: '#ff9fcf', belly: '#fff0f8' }
];
