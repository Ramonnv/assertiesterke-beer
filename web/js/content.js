// Inhoud van Sterke Beer (situaties, levels, Plaagvos-zinnen). Overgenomen uit versie 1.
/* ================= DATA ================= */
export const KEY = "sterkebeer_v1";

export const AN = {
  beer:{e:"🐻", n:"Beer"},
  muis:{e:"🐭", n:"Muis"},
  draak:{e:"🐲", n:"Draak"}
};

// Situaties: kies de Beer-reactie
export const SC = {
  gum:{e:"✏️", q:"Iemand pakt zonder te vragen je gum.",
    beer:"“Hé, dat is mijn gum. Mag ik hem terug?”",
    muis:"Niks zeggen en maar een andere gum zoeken.",
    draak:"Zijn etui op de grond gooien.",
    u:"Beer zegt rustig en duidelijk wat ze wil."},
  meedoen:{e:"🏃‍♀️", q:"Je wilt meedoen met tikkertje. Iemand roept: “Jij mag niet meedoen!”",
    beer:"“Ik wil graag meedoen.” En blijft het nee? Dan ga je met anderen spelen.",
    muis:"De hele pauze alleen en verdrietig in een hoekje zitten.",
    draak:"Gillen: “Jullie zijn stom!” en de bal wegschoppen.",
    u:"Beer vraagt het duidelijk. En als het niet lukt, zoekt ze zelf iets leuks."},
  duwen:{e:"🚶‍♀️", q:"Iemand duwt je in de rij.",
    beer:"Rechtop staan en zeggen: “Stop. Niet duwen.”",
    muis:"Opzij gaan en achteraan aansluiten.",
    draak:"Keihard terugduwen.",
    u:"Stevig staan + korte zin = Beer-kracht!"},
  tekening:{e:"🎨", q:"Een klasgenoot lacht om je tekening.",
    beer:"“Ik vind hem mooi. Jij hoeft hem niet mooi te vinden.”",
    muis:"Je tekening snel verscheuren.",
    draak:"“Jouw tekening is nog veel lelijker!”",
    u:"Jij bepaalt zelf wat je van je tekening vindt."},
  porren:{e:"👉", q:"Iemand blijft je porren, ook al zei je al dat je het niet leuk vindt.",
    beer:"Stop-hand omhoog: “STOP. Ik wil dat niet.” Gaat het door? Naar de juf.",
    muis:"Het maar laten gebeuren.",
    draak:"Hem een klap geven.",
    u:"Jouw lijf is van jou. Stop is stop."},
  snoep:{e:"🍬", q:"Een vriendin zegt: “Als je mij je snoep niet geeft, ben je mijn vriendin niet meer.”",
    beer:"“Echte vriendinnen doen niet zo. Ik deel als ik dat zelf wil.”",
    muis:"Snel al je snoep geven.",
    draak:"“Dan ben jij ook mijn vriendin niet meer, sukkel!”",
    u:"Een echte vriendin dreigt niet. Jij mag nee zeggen."},
  dom:{e:"🙋‍♀️", q:"Je geeft een fout antwoord in de klas en iemand roept: “Dom!”",
    beer:"“Fouten maken mag. Zo leer je.”",
    muis:"Nooit meer je vinger opsteken.",
    draak:"“Jij bent zelf dom!”",
    u:"Iedereen maakt fouten. Ook de slimste mensen van de wereld."},
  online:{e:"🎮", q:"Iemand in een online spelletje vraagt waar je woont en op welke school je zit.",
    beer:"Niks vertellen, stoppen met het spel en het aan papa of mama laten zien.",
    muis:"Het toch vertellen, want hij vraagt het zo aardig.",
    draak:"Hem in de chat heel gemeen uitschelden.",
    u:"Je adres en school zijn geheim online. Altijd."},
  ander:{e:"🧒", q:"Je ziet dat een ander kind steeds wordt uitgelachen.",
    beer:"Naast het kind gaan staan: “Kom, speel je met ons mee?”",
    muis:"Doen alsof je niks ziet.",
    draak:"De pesters keihard uitschelden en duwen.",
    u:"Een klein beetje hulp is al heel veel waard."},
  kleren:{e:"👕", q:"Iemand zegt: “Jouw kleren zijn suf.”",
    beer:"Schouders ophalen: “Ik vind ze fijn.” En verder gaan.",
    muis:"Huilen en morgen andere kleren willen.",
    draak:"“Jij bent zelf suf!”",
    u:"Jij hoeft niet te veranderen omdat iemand iets roept."},
  bal:{e:"⚽", q:"Een groter kind zegt: “Geef je bal, anders…!”",
    beer:"Weglopen naar een plek waar een grote mens is en het meteen vertellen.",
    muis:"De bal geven en het aan niemand vertellen.",
    draak:"De bal naar zijn hoofd gooien.",
    u:"Bij dreigen: niet alleen oplossen. Haal hulp, dat is slim."},
  geheim:{e:"🤫", q:"Iemand wil dat je een geheim bewaart, maar het voelt naar in je buik.",
    beer:"Een naar geheim mag je altijd vertellen aan papa, mama of de juf.",
    muis:"Het geheim houden, ook al voel je je rot.",
    draak:"Boos worden en het andere kind uitschelden.",
    u:"Fijne geheimen (zoals een cadeau) mag je bewaren. Nare geheimen niet."},
  glijbaan:{e:"🛝", q:"Iemand dringt voor bij de glijbaan.",
    beer:"“Hé, ik was eerst. Jij mag na mij.”",
    muis:"Wachten tot iedereen geweest is.",
    draak:"Hem van de trap trekken.",
    u:"Kort en duidelijk. Precies zo!"},
  app:{e:"📱", q:"In de groepsapp sturen kinderen een gemeen plaatje over jou.",
    beer:"Niet terugsturen, een screenshot maken en het aan papa of mama laten zien.",
    muis:"Alles stilletjes lezen en het aan niemand vertellen.",
    draak:"Iets nóg gemeners terugsturen.",
    u:"Screenshot = bewijs. En samen ben je sterker."},
  kanniks:{e:"😤", q:"Iemand zegt: “Jij kan echt niks.”",
    beer:"“Ik kan heel veel. En wat ik nog niet kan, leer ik.”",
    muis:"Gaan denken dat het waar is.",
    draak:"“Jij kan nog minder, loser!”",
    u:"Wat een ander roept, is niet de waarheid over jou."},
  vallen:{e:"🤸‍♀️", q:"Bij sport val je en iemand lacht je uit.",
    beer:"Opstaan, schouders ophalen: “Iedereen valt weleens!”",
    muis:"Nooit meer mee willen doen.",
    draak:"Hem expres laten struikelen.",
    u:"Vallen hoort bij leren. Echte sporters vallen heel vaak!"},
  plek:{e:"🪑", q:"Iemand gaat steeds op jouw plekje in de kring zitten.",
    beer:"“Dit is mijn plek. Wil je opschuiven?”",
    muis:"Dan maar op de grond gaan zitten.",
    draak:"Hem van de stoel duwen.",
    u:"Vriendelijk maar duidelijk. Dat is Beer!"},
  // --- extra pestkop-situaties ---
  nadoen:{e:"🦜", q:"Een groepje doet steeds jouw stem na en lacht.",
    beer:"Schouders ophalen, “Boeiend.” zeggen en rustig naar je vriendinnen lopen.",
    muis:"De rest van de dag niks meer durven zeggen.",
    draak:"Gaan gillen en huilen van boosheid, recht in hun gezicht.",
    u:"Pestkoppen willen een grote reactie. Geef ze een saaie: dan is de lol eraf."},
  tas:{e:"🎒", q:"Iemand heeft je tas verstopt en roept: “Zoek maar!”",
    beer:"“Geef mijn tas terug. Anders haal ik de juf.” En dat doe je ook.",
    muis:"Stilletjes de hele pauze zoeken.",
    draak:"Zijn tas pakken en in de prullenbak gooien.",
    u:"Eerst zelf duidelijk zijn. Helpt het niet? Dan hulp halen."},
  naroepen:{e:"📣", q:"Elke dag roept iemand een gemene bijnaam naar je.",
    beer:"“Ik heet gewoon …” zeggen, weglopen, en het thuis en op school vertellen.",
    muis:"Doen alsof het je niks kan schelen, maar het aan niemand vertellen.",
    draak:"Een nog gemenere bijnaam terugroepen.",
    u:"Als het elke dag gebeurt, is het pesten. Dan mag en moet je hulp halen."},
  // --- geven en nemen ---
  spel:{e:"🙈", q:"Jij wilt tikkertje doen, je vriendin wil verstoppertje.",
    beer:"“Eerst verstoppertje, daarna tikkertje?”",
    muis:"Niks zeggen en de hele tijd stiekem balen.",
    draak:"“Nee, we doen tikkertje, anders speel ik niet mee!”",
    u:"Om de beurt kiezen is eerlijk. Zo blijven jullie vriendinnen.",
    fd:"🐲 Draak-reactie: altijd je eigen zin willen. Dan wil de ander straks niet meer met je spelen.",
    fm:"🐭 Muis-reactie: jij mag óók zeggen wat jij wil. Dan kunnen jullie samen kiezen."},
  tv:{e:"📺", q:"Jij en je zus of broer willen allebei iets anders kijken.",
    beer:"“Jij kiest vandaag, ik kies morgen. Deal?”",
    muis:"Boos naar je kamer gaan en niks zeggen.",
    draak:"De afstandsbediening afpakken en niet meer teruggeven.",
    u:"Geven en nemen: de ene keer jij, de andere keer de ander.",
    fd:"🐲 Draak-reactie: afpakken is je zin doordrijven. Dan wordt het ruzie.",
    fm:"🐭 Muis-reactie: weglopen lost niks op. Bedenk samen een eerlijke oplossing."},
  schommel:{e:"🌳", q:"Er is maar één schommel en jullie willen allebei.",
    beer:"“Jij 20 keer, dan ik 20 keer.”",
    muis:"Dan maar helemaal niet schommelen.",
    draak:"Erop springen en er niet meer af gaan.",
    u:"Samen delen = samen plezier.",
    fd:"🐲 Draak-reactie: dan heb jij plezier, maar de ander niet. Dat is niet eerlijk.",
    fm:"🐭 Muis-reactie: jij mag ook een beurt! Stel voor om te wisselen."},
  groepje:{e:"🖍️", q:"In je groepje heeft iedereen een ander idee voor de poster.",
    beer:"Naar elk idee luisteren en samen kiezen, ook als het niet jouw idee wordt.",
    muis:"Niks zeggen, ook al heb je een goed idee.",
    draak:"“Mijn idee is het beste, de rest is stom!”",
    u:"Een goed groepslid zegt haar idee én luistert naar de ander.",
    fd:"🐲 Draak-reactie: alleen jouw idee telt? Dan voelt de rest zich niet gehoord.",
    fm:"🐭 Muis-reactie: jouw idee is ook belangrijk. Zeg het gewoon!"},
  verliezen:{e:"🎲", q:"Je verliest met een spelletje.",
    beer:"“Goed gespeeld! Nog een potje?”",
    muis:"Huilen en nooit meer mee willen spelen.",
    draak:"Het bord omgooien.",
    u:"Tegen je verlies kunnen is ook Beer-kracht. Morgen win je misschien!",
    fd:"🐲 Draak-reactie: dan wil niemand meer met je spelen.",
    fm:"🐭 Muis-reactie: verliezen is even balen, en dan weer verder."},
  verdrietig:{e:"🥺", q:"Je vriendin is verdrietig en wil iets anders doen dan jij.",
    beer:"“Oké, dan doen we vandaag wat jij wil.”",
    muis:"Zeggen dat het goed is, maar daarna de hele tijd zuchten.",
    draak:"“Jammer, ik wil toch mijn spel doen.”",
    u:"Soms geef je toe omdat je om iemand geeft. Dat is ook sterk!",
    fd:"🐲 Draak-reactie: een goede vriendin kijkt ook naar hoe de ander zich voelt.",
    fm:"🐭 Muis-reactie: als je toegeeft, doe het dan met je hele hart. 💛"}
};

// Flitsronde: Plaagvos zegt iets, jij antwoordt snel
export const FL = [
  {z:"Haha, wat heb jij rare schoenen!", g:["Ik vind ze fijn.","Kan zijn. Ik vind ze leuk."], m:"(niks zeggen en wegkijken)", d:"Jij hebt zelf rare schoenen, sukkel!"},
  {z:"Jij mag niet meedoen!", g:["Oké, dan speel ik met iemand anders.","Ik wil wel meedoen. Waarom niet?"], m:"(huilend weglopen)", d:"Jullie spel is toch stom!"},
  {z:"Jij bent echt dom.", g:["Dat vind jij. Ik niet.","Nee hoor."], m:"Ja… dat is waar.", d:"JIJ bent dom!"},
  {z:"Waarom praat jij zo raar?", g:["Zo praat ik nou eenmaal.","Kan zijn."], m:"(niks meer durven zeggen)", d:"Jij praat zelf raar!"},
  {z:"Bah, jij stinkt!", g:["Nee hoor. Doei!","Dat vind jij."], m:"(je schamen en wegkruipen)", d:"Jij stinkt zelf het meest!"},
  {z:"Ga weg, dit is óns plekje.", g:["Het schoolplein is van iedereen.","Ik sta hier prima."], m:"Sorry sorry, ik ga al…", d:"Ik sla jullie!"},
  {z:"Jij kan niet eens zonder handen fietsen.", g:["Klopt. En?","Nog niet. Ik oefen."], m:"(je heel dom voelen)", d:"Jij kan helemaal niks!"},
  {z:"Wat een stomme tekening.", g:["Ik ben er blij mee.","Dat vind jij."], m:"(je tekening verscheuren)", d:"Jouw tekening is nog stommer!"},
  {z:"Huilebalk!", g:["Iedereen huilt weleens.","Kan zijn. Doei!"], m:"(nog harder huilen)", d:"Ik maak jou ook aan het huilen!"},
  {z:"Niemand vindt jou aardig.", g:["Dat is niet waar.","Dat zeg jij."], m:"Ja… misschien wel.", d:"Jij bent de gemeenste van de hele school!"},
  {z:"Durf je niet zeker, bangerik?", g:["Ik hoef niks te bewijzen.","Nee. En?"], m:"(het toch doen, ook al wil je niet)", d:"Ik durf veel meer dan jij!"},
  {z:"Jij hoort er niet bij.", g:["Ik hoor er net zo goed bij.","Dat bepaal jij niet."], m:"(alleen in een hoekje gaan zitten)", d:"Jullie club is toch stom!"},
  {z:"Je haar is lelijk.", g:["Ik vind het mooi. Klaar.","Kan zijn."], m:"(je haar de hele dag verstoppen)", d:"Jouw haar is pas lelijk!"},
  {z:"Jij bent de langzaamste van de klas!", g:["Ik doe mijn best. Prima toch?","Kan zijn. En?"], m:"(nooit meer mee willen rennen)", d:"En jij bent de gemeenste!"},
  {z:"Hihihi, hoor haar praten!", g:["Boeiend.","Oké. Doei!"], m:"(rood worden en niks meer zeggen)", d:"Hou op of ik ga gillen!"},
  {z:"Zoek je tas maar, haha!", g:["Geef hem terug, of ik haal de juf.","Ik haal nu de juf."], m:"(stilletjes gaan zoeken)", d:"Dan gooi ik jouw tas weg!"},
  {z:"Jij bent een baby!", g:["Nee hoor. Doei!","Dat vind jij."], m:"(gaan huilen)", d:"Jij bent zelf een baby!"},
  {z:"Iedereen vindt jou stom, vraag maar.", g:["Dat geloof ik niet.","Nee hoor, en ik ga nu spelen."], m:"(alle kinderen gaan vragen of het waar is)", d:"Iedereen vindt JOU stom!"}
];

// Gedachten
export const KRACHT = ["Ik mag er zijn","Fouten maken mag","Ik kan het proberen","Ik ben goed zoals ik ben","Ik mag nee zeggen","Ik ben sterk vanbinnen","Ik mag hulp vragen","Ik oefen en word beter","Mijn gevoel klopt","Ik ben een goede vriendin","Ik ben dapper"];
export const GEMEEN = [
  ["Ik kan niks","Ik kan veel, en de rest leer ik nog"],
  ["Niemand vindt mij leuk","Er zijn mensen die mij heel leuk vinden"],
  ["Het is mijn schuld","Pesten is nooit de schuld van wie gepest wordt"],
  ["Ik ben dom","Ik leer elke dag nieuwe dingen"],
  ["Ik durf het nooit","Ik kan het een klein stapje proberen"],
  ["Ik moet doen wat zij zeggen","Ik mag zelf kiezen"],
  ["Ik ben raar","Ik ben uniek, en dat is cool"],
  ["Hulp vragen is klikken","Hulp vragen is slim en dapper"]
];

// Zelf oplossen of hulp halen
export const SORT = [
  {e:"🧥", t:"Iemand dringt voor bij de kapstok.", a:"zelf", u:"Zeg: “Hé, ik was eerst.”"},
  {e:"🦵", t:"Iemand schopt je, elke pauze weer.", a:"hulp", u:"Bij pijn doen, en als het steeds doorgaat: altijd hulp halen."},
  {e:"👟", t:"Iemand zegt dat je schoenen gek zijn.", a:"zelf", u:"Mistbank! “Kan zijn. Ik vind ze fijn.”"},
  {e:"📷", t:"Iemand die je niet kent vraagt online om een foto van jou.", a:"hulp", u:"Nooit doen. Laat het meteen aan papa of mama zien."},
  {e:"😠", t:"Een groter kind dreigt: “Na school pak ik je!”", a:"hulp", u:"Dreigen is ernstig. Vertel het meteen aan een grote mens."},
  {e:"🪑", t:"Je vriendin pakt je stoel als je even weg bent.", a:"zelf", u:"“Dat is mijn plek. Wil je opschuiven?”"},
  {e:"🤫", t:"Iemand wil dat je een naar geheim bewaart.", a:"hulp", u:"Nare geheimen mag je altijd vertellen."},
  {e:"🙋‍♀️", t:"Iemand lacht om je fout in de klas.", a:"zelf", u:"“Fouten maken mag.” En gewoon verder."},
  {e:"🗓️", t:"Je wordt al een week steeds buitengesloten.", a:"hulp", u:"Als het blijft doorgaan, kan een grote mens helpen."},
  {e:"⚽", t:"Iemand pakt je bal af om je te plagen.", a:"zelf", u:"“Stop. Geef hem terug.” Lukt het niet? Dan alsnog hulp halen."}
];

// Vasthouden of meegeven?
export const HOUD = [
  {e:"🎲", t:"Welk spelletje jullie in de pauze doen.", a:"mee", u:"Een klein ding. Om de beurt kiezen is eerlijk."},
  {e:"😆", t:"Iemand wil dat je meelacht met een kind dat gepest wordt.", a:"vast", u:"Nee! Meedoen met pesten doe je nooit."},
  {e:"🛝", t:"Wie er eerst op de schommel mag.", a:"mee", u:"De ander mag ook eens eerst. Jij komt zo."},
  {e:"🤗", t:"Iemand wil je knuffelen, maar jij wil dat niet.", a:"vast", u:"Jouw lijf is van jou. Nee is nee."},
  {e:"🎬", t:"Welke film jullie samen kijken.", a:"mee", u:"Vandaag de ander, volgende keer jij."},
  {e:"🔑", t:"Iemand wil je wachtwoord weten.", a:"vast", u:"Je wachtwoord is altijd geheim, ook voor vriendinnen."},
  {e:"🖍️", t:"Je vriendin wil de roze stift die jij ook wilde.", a:"mee", u:"Je kunt ook een andere kleur pakken, of straks wisselen."},
  {e:"🧗‍♀️", t:"Iemand daagt je uit om iets gevaarlijks te doen.", a:"vast", u:"Bij gevaar hou je vast: nee!"},
  {e:"🍕", t:"Jullie eten pizza, en je zus wil liever pannenkoeken.", a:"mee", u:"Volgende keer mag zij kiezen. Geven en nemen!"},
  {e:"🤥", t:"Iemand wil dat je liegt tegen je ouders.", a:"vast", u:"Liegen voor een ander hoeft niet. Je mag nee zeggen."}
];
export const SORT_LABELS = {
  zelf:{e:"🐻", t:"Zelf oplossen met Beer-kracht"},
  hulp:{e:"🧑‍🏫", t:"Hulp halen bij een grote mens"},
  vast:{e:"🐻", t:"Vasthouden: dit is belangrijk!"},
  mee:{e:"🤝", t:"Meegeven: de ander mag ook eens"}
};

// Krachtzin-bouwer
export const ZIN = [
  {sit:"Iemand pakt steeds je pen af.", cols:[
    [["Stop!",1],["Eh… sorry…",0],["Jij sukkel!",0]],
    [["Dat is mijn pen.",1],["Het geeft niet hoor…",0],["Ik maak je kapot!",0]],
    [["Geef hem terug.",1],["Laat maar…",0],["Wacht maar tot straks!",0]]]},
  {sit:"Iemand blijft aan je haar trekken.", cols:[
    [["Hé!",1],["Auw… ehm…",0],["Rotkind!",0]],
    [["Ik wil dat niet.",1],["Misschien wil je stoppen…?",0],["Ik trek ook aan jouw haar!",0]],
    [["Blijf van me af.",1],["Sorry dat ik iets zeg.",0],["Ik sla je!",0]]]},
  {sit:"Kinderen zeggen dat je niet mag meedoen.", cols:[
    [["Ik wil meedoen.",1],["Ik mag zeker niet, hè…",0],["Jullie zijn stom!",0]],
    [["Iedereen mag meedoen.",1],["Nou ja, laat maar.",0],["Ik verpest jullie spel!",0]],
    [["Wat spelen we?",1],["(zuchten en weglopen)",0],["Ik ga jullie verklikken!",0]]]}
];

// Levels: elke dag gaat er één nieuw level open
export const LEVELS = [
  {t:"Hallo Beer!", e:"🐻",
   m:"Vertel aan papa of mama wie Muis, Draak en Beer zijn.",
   acts:[
    {type:"les", lines:[
      "Hoi {naam}! Ik ben <b>Beer</b>. Ik ben sterk vanbinnen. 💛",
      "Als iemand vervelend doet, kun je op 3 manieren reageren:",
      "<div class='trio'><span>🐭<br><b>Muis</b><br>maakt zich klein en zegt niks</span><span>🐲<br><b>Draak</b><br>wordt boos en doet gemeen terug</span><span>🐻<br><b>Beer</b><br>blijft rustig en zegt duidelijk wat ze wil</span></div>",
      "Iedereen voelt zich weleens Muis of Draak, dat is normaal! Maar met Beer-kracht los je het meestal het best op.",
      "Laten we oefenen! Kies steeds de Beer-reactie. 🐾"]},
    {type:"kies", items:["gum","duwen","glijbaan"], hints:true},
    {type:"les", lines:["Goed gedaan! Nog één geheimpje: als je je boos of bang voelt, helpt <b>ballon-adem</b> 🎈 om weer rustig te worden."]},
    {type:"adem", rounds:3}]},
  {t:"Sta als een beer", e:"🧍‍♀️",
   m:"Sta vandaag 1 keer als een beer voor de spiegel. Voel je kracht!",
   acts:[
    {type:"les", lines:[
      "Weet je wat het geheim van Beer is?",
      "Het begint met je <b>lijf</b>! Als je stevig staat, voel je je ook sterker.",
      "Plaaggeesten kiezen vaak iemand die klein en bang lijkt. Sta je als een beer? Dan laten ze je sneller met rust.",
      "Sta even op. We gaan oefenen! 🧍‍♀️"]},
    {type:"houding"},
    {type:"kies", items:["tekening","kleren","dom"], hints:true}]},
  {t:"Je beer-stem", e:"🗣️",
   m:"Zeg vandaag 1 keer in je beer-stem: “Nee, dank je.”",
   acts:[
    {type:"les", lines:[
      "Je stem is een superkracht! 🗣️",
      "Muis fluistert. Draak schreeuwt. Beer praat <b>duidelijk en rustig</b>, alsof ze het echt meent.",
      "Kort is krachtig. Hoe korter je zin, hoe sterker hij klinkt."]},
    {type:"stem"},
    {type:"zin", set:0}]},
  {t:"De Stop-hand", e:"✋",
   m:"Oefen de Stop-hand met papa of mama. Om de beurt!",
   acts:[
    {type:"les", lines:[
      "Dit is de <b>Stop-hand</b> ✋",
      "1. Hand omhoog, als een verkeersagent.<br>2. Zeg: <b>“Stop! Ik wil dat niet.”</b><br>3. Gaat het door? Loop weg en vertel het aan een grote mens.",
      "Jouw lijf is van jou. Jij mag altijd stop zeggen. 💛"]},
    {type:"kies", items:["porren","duwen","vallen"]},
    {type:"zin", set:1}]},
  {t:"Snel als een beer", e:"⚡",
   m:"Bedenk samen met papa of mama je eigen snelle beer-zin.",
   acts:[
    {type:"les", lines:[
      "Plaagvos 🦊 gaat je uitdagen!",
      "Als iemand je plaagt, helpt het om <b>snel</b> iets te zeggen. Je hoeft niet grappig of gemeen te zijn.",
      "Een korte, rustige zin is genoeg. Dan merkt Plaagvos: met jou valt niet te sollen.",
      "Kies zo snel als je kan het Beer-antwoord. Klaar? ⚡"]},
    {type:"flits", rounds:6, time:9}]},
  {t:"Gedachten-vangers", e:"💭",
   m:"Zeg vanavond voor het slapen 3 kracht-gedachten tegen jezelf.",
   acts:[
    {type:"les", lines:[
      "Soms zit de plaaggeest niet buiten, maar in je <b>hoofd</b>. 💭",
      "Gedachten als <i>“Ik kan niks”</i> maken je klein. Maar je kunt ze <b>omdraaien</b>!",
      "Tik op de bubbels.<br>💚 Een kracht-gedachte = 1 punt.<br>🌧️ Een gemene gedachte omdraaien = 2 punten!"]},
    {type:"gedachten", secs:35, target:14}]},
  {t:"De mistbank", e:"🌫️",
   m:"Papa of mama zegt iets geks. Jij zegt “Kan zijn!” en loopt stoer weg.",
   acts:[
    {type:"les", lines:[
      "Nieuwe Beer-truc: <b>de mistbank</b> 🌫️",
      "Als iemand iets stoms zegt, ga je geen ruzie maken. Je zegt heel rustig:",
      "<div class='chips'><span>“Kan zijn.”</span><span>“Dat vind jij.”</span><span>“En?”</span><span>“Oké. Doei!”</span></div>",
      "De plaagzin verdwijnt in de mist. Er is niks meer om op te reageren! Daarna loop je rustig weg. 😎"]},
    {type:"flits", rounds:7, time:8}]},
  {t:"Saai voor pestkoppen", e:"🥱",
   m:"Oefen met papa of mama: zij plagen, jij doet Stop – Zeg – Ga.",
   acts:[
    {type:"les", lines:[
      "Weet je wat pestkoppen het leukst vinden? Als je <b>heel boos</b> wordt of <b>gaat huilen</b>. Dat vinden ze spannend.",
      "Het geheim: maak het <b>saai</b> voor ze! 🥱 Dan is de lol eraf en zoeken ze iets anders.",
      "Onthoud de Beer-truc <b>Stop – Zeg – Ga</b>:<br>🛑 <b>Stop:</b> sta stevig, adem rustig.<br>💬 <b>Zeg:</b> één korte zin (“Boeiend.” “Kan zijn.” “Stop.”)<br>🚶‍♀️ <b>Ga:</b> loop rustig weg naar je vriendinnen of een juf.",
      "En voel je je daarna toch verdrietig of boos? Dat is normaal! Vertel het thuis. Je hoeft het niet alleen te dragen. 💛"]},
    {type:"kies", items:["nadoen","tas","naroepen"]},
    {type:"flits", rounds:7, time:7}]},
  {t:"Hulp halen is dapper", e:"🦸‍♀️",
   m:"Noem 3 grote mensen bij wie jij hulp kunt vragen.",
   acts:[
    {type:"les", lines:[
      "Soms kun je het niet alleen. Dat is helemaal oké!",
      "Bij slaan, schoppen, dreigen, of als het steeds blijft doorgaan: haal <b>altijd</b> een grote mens.",
      "<b>Klikken</b> is om iemand in de problemen te brengen.<br><b>Hulp vragen</b> is om iemand uit de problemen te halen. 🦸‍♀️",
      "Kies steeds: zelf oplossen met Beer-kracht, of hulp halen?"]},
    {type:"sorteer", n:7},
    {type:"kies", items:["bal","geheim"]}]},
  {t:"Sterk voor een ander", e:"🤝",
   m:"Doe vandaag iets aardigs voor iemand die alleen staat.",
   acts:[
    {type:"les", lines:[
      "Een echte beer is ook sterk <b>voor een ander</b>. 🤝",
      "Zie je dat iemand gepest wordt? Je hoeft geen superheld te zijn. Kleine dingen helpen al:",
      "Ga naast het kind staan. Vraag of hij of zij mee wil spelen. Of vertel het aan de juf of meester."]},
    {type:"kies", items:["ander","meedoen","snoep"]},
    {type:"zin", set:2}]},
  {t:"Geven en nemen", e:"⚖️",
   m:"Laat vandaag iemand anders kiezen welk spelletje jullie doen.",
   acts:[
    {type:"les", lines:[
      "Beer is sterk. Maar Beer is ook een <b>goede vriendin</b>. 💛",
      "Sterk zijn betekent <b>niet</b> dat je altijd je zin krijgt! Wie altijd de baas wil zijn, is eigenlijk een beetje een Draak.",
      "Soms kies jij, soms kiest de ander. Dat heet <b>geven en nemen</b>. ⚖️",
      "Een echte Beer kan zeggen: <b>“Oké, eerst jouw spel, en daarna het mijne!”</b> Zo heeft iedereen plezier.",
      "Let op: Beer laat zich niet <i>alles</i> afpakken. Ze zegt wat ze wil, en luistert ook naar de ander. Samen zoek je een eerlijke oplossing."]},
    {type:"kies", items:["spel","tv","schommel","verliezen"], hints:true}]},
  {t:"Vasthouden of meegeven?", e:"🤔",
   m:"Bedenk samen met papa of mama: wanneer geef jij toe, en wanneer hou je vast?",
   acts:[
    {type:"les", lines:[
      "Hoe weet je nou wanneer je moet <b>vasthouden</b> en wanneer je kunt <b>meegeven</b>? 🤔",
      "🐻 <b>Vasthouden</b> doe je bij belangrijke dingen: je lijf, je veiligheid, geheimen die naar voelen, en als iemand anders pijn wordt gedaan.",
      "🤝 <b>Meegeven</b> kan bij kleine dingen: welk spelletje, wie eerst mag, welke film. De ander mag ook eens kiezen!",
      "Vraag jezelf af: <b>“Is dit belangrijk, of is het klein?”</b>"]},
    {type:"sorteer", pool:"houd", n:8},
    {type:"kies", items:["groepje","verdrietig"]}]},
  {t:"Veilig online", e:"📱",
   m:"Kijk samen met papa of mama welke spelletjes je online speelt, en spreek regels af.",
   acts:[
    {type:"les", lines:[
      "Ook op de tablet en telefoon kun je Beer zijn! 📱",
      "Beer-regels online:<br>🔒 Vertel nooit je adres, school of wachtwoord.<br>📸 Gemeen bericht? Niet terugsturen, maak een screenshot.<br>🧑‍🧑‍🧒 Laat het altijd aan papa of mama zien."]},
    {type:"kies", items:["online","app","geheim"]}]},
  {t:"Flitsronde Plus", e:"⚡",
   m:"Speel pestkop-toneel: papa of mama is Plaagvos, jij antwoordt snel als een beer.",
   acts:[
    {type:"les", lines:["Flitsronde Plus! ⚡⚡","Nu heb je minder tijd. Weet je nog? Kort, rustig en duidelijk.","Laat Plaagvos maar komen!"]},
    {type:"flits", rounds:10, time:6}]},
  {t:"Rustig én sterk", e:"🎈",
   m:"Doe ballon-adem als je je boos of bang voelt.",
   acts:[
    {type:"les", lines:["Als je boos of bang bent, is het lastig om Beer te zijn.","Daarom eerst <b>ballon-adem</b> 🎈 en daarna je kracht-gedachten. Rustig én sterk!"]},
    {type:"adem", rounds:4},
    {type:"gedachten", secs:40, target:18, fast:true}]},
  {t:"Grote training", e:"🏋️‍♀️",
   m:"Vertel iemand waar je trots op bent.",
   acts:[
    {type:"les", lines:["Grote Beer-training! 🏋️‍♀️","Alles wat je geleerd hebt komt terug, en er loopt een klok. Je kan het!"]},
    {type:"kies", items:["kanniks","plek","tekening","online"], timer:12},
    {type:"flits", rounds:6, time:6}]},
  {t:"Finale: Beer-Legende!", e:"👑",
   m:"Geef jezelf een high-five: je bent een Beer-Legende! 🙌",
   acts:[
    {type:"les", lines:["De finale! 👑","Laat zien wat je allemaal kan. Daarna ben je een echte <b>Beer-Legende</b>!"]},
    {type:"kies", items:"random4", timer:10},
    {type:"flits", rounds:8, time:5},
    {type:"zin", set:"random"}]}
];

export const RANKS = [[0,"Rookie","🎒"],[7,"Beer-in-training","⭐"],[18,"Stoere Beer","🧢"],[30,"Sterke Beer","💪"],[43,"Beer-Legende","👑"]];

