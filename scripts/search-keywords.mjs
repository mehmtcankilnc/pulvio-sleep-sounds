// Akıllı arama sözlüğü — kaynak-of-truth. `node scripts/gen-search-keywords-sql.mjs`
// bunu 0024 migration'ına çevirir (catalog_subcategories.keywords jsonb).
//
// Mantık: dile bağlı "kavram" sözlüğü (CONCEPTS) + her alt kategorinin hangi
// kavramlara bağlı olduğu (SUB_CONCEPTS). Üretici her alt kategori için dil
// başına anahtar kelime listesi çıkarır. İstemci aramada TÜM dillerin kelimelerine
// bakar, yani Türkçe "bebek" İngilizce arayüzde de çalışır.
//
// Yeni alt kategori eklerken: SUB_CONCEPTS'e satır ekle (gerekirse CONCEPTS'e yeni
// kavram), scripts/gen-search-keywords-sql.mjs'i çalıştır, çıkan SQL'i çalıştır.
// Mağaza güncellemesi gerekmez.
//
// Sıra: tr, en, de, fr, es, pt. Virgülle ayrılmış; çok kelimeli ifadeler serbest.
const C = (tr, en, de, fr, es, pt) => ({ tr, en, de, fr, es, pt });

export const CONCEPTS = {
  rain: C("yağmur,sağanak,çiseleme", "rain,drizzle,shower", "regen,nieselregen", "pluie,averse", "lluvia,llovizna", "chuva,garoa"),
  water: C("su,akarsu,su sesi", "water,flowing", "wasser", "eau", "agua", "agua,água"),
  storm: C("fırtına,gök gürültüsü,şimşek,yıldırım", "storm,thunder,lightning", "gewitter,donner,sturm,blitz", "orage,tonnerre,tempête,éclair", "tormenta,trueno,relámpago", "tempestade,trovão,relâmpago"),
  sea: C("deniz,okyanus,dalga,sahil,plaj", "sea,ocean,waves,beach,shore", "meer,ozean,wellen,strand", "mer,océan,vagues,plage", "mar,océano,olas,playa", "mar,oceano,ondas,praia"),
  river: C("nehir,dere,ırmak,akarsu", "river,stream,brook,creek", "fluss,bach", "rivière,ruisseau", "río,arroyo", "rio,riacho,córrego"),
  lake: C("göl,gölet,göl kenarı", "lake,pond,lakeside", "see,teich,seeufer", "lac,étang", "lago,estanque", "lago,lagoa"),
  forest: C("orman,ağaç,doğa,yaprak", "forest,woods,trees,nature,leaves", "wald,bäume,natur,blätter", "forêt,arbres,nature,feuilles", "bosque,árboles,naturaleza,hojas", "floresta,árvores,natureza,folhas"),
  wind: C("rüzgar,rüzgâr,esinti,meltem", "wind,breeze,gust", "wind,brise", "vent,brise", "viento,brisa", "vento,brisa"),
  night: C("gece,akşam,karanlık", "night,evening,dark", "nacht,abend,dunkel", "nuit,soir,sombre", "noche,tarde,oscuro", "noite,escuro"),
  fire: C("ateş,şömine,odun,kamp ateşi,çıtırtı", "fire,fireplace,campfire,crackling,wood", "feuer,kamin,lagerfeuer,knistern", "feu,cheminée,crépitement", "fuego,chimenea,hoguera,crepitar", "fogo,lareira,fogueira,crepitar"),
  noise: C("gürültü,uğultu,beyaz gürültü,fon", "noise,hum,static,white noise,background", "rauschen,brummen,hintergrund", "bruit,bourdonnement,fond", "ruido,zumbido,fondo", "ruído,zumbido,fundo"),
  cafe: C("kafe,kahve,restoran,kalabalık,sohbet", "cafe,coffee,restaurant,crowd,chatter", "café,kaffee,restaurant,menschen,stimmen", "café,restaurant,foule,voix", "café,restaurante,gente,voces", "café,restaurante,multidão,vozes"),
  transport: C("yolculuk,seyahat,ulaşım,araç,toplu taşıma", "travel,journey,transport,vehicle,commute", "reise,fahrt,verkehr,fahrzeug", "voyage,trajet,transport,véhicule", "viaje,trayecto,transporte,vehículo", "viagem,trajeto,transporte,veículo"),
  train: C("tren,ray,vagon,gar", "train,rail,railway,railroad", "zug,bahn,schiene", "train,rail,chemin de fer", "tren,riel,ferrocarril", "trem,trilho,ferrovia"),
  plane: C("uçak,kabin,uçuş,havayolu", "plane,airplane,flight,aircraft,cabin", "flugzeug,flug,kabine", "avion,vol,cabine", "avión,vuelo,cabina", "avião,voo,cabine"),
  bus: C("otobüs,minibüs,şehir içi", "bus,coach", "bus,omnibus", "bus,autobus,autocar", "autobús,bus,colectivo", "ônibus,bus"),
  car: C("araba,otomobil,araç içi,yol,otoyol,sürüş", "car,driving,road,highway,drive", "auto,fahren,straße,autobahn", "voiture,conduite,route,autoroute", "coche,carro,conducir,carretera,autopista", "carro,dirigir,estrada,rodovia"),
  boat: C("gemi,feribot,tekne,vapur,liman", "ship,ferry,boat,vessel,harbor,cruise", "schiff,fähre,boot,hafen", "bateau,navire,ferry,port", "barco,ferri,buque,puerto", "navio,balsa,barco,porto"),
  metro: C("metro,tramvay,raylı sistem,istasyon", "metro,subway,tram,underground,station", "u-bahn,straßenbahn,bahnhof", "métro,tramway,station", "metro,tranvía,estación", "metrô,bonde,estação"),
  truck: C("tır,kamyon,şoför,yük", "truck,lorry,trucker,cargo", "lkw,lastwagen,trucker", "camion,routier", "camión,camionero", "caminhão,caminhoneiro"),
  baby: C("bebek,yenidoğan,bebek uyutma,çocuk,ninni", "baby,newborn,infant,child,toddler,lullaby", "baby,säugling,neugeborenes,kind,wiegenlied", "bébé,nouveau-né,enfant,berceuse", "bebé,recién nacido,niño,nana", "bebê,recém-nascido,criança,cantiga de ninar"),
  sleep: C("uyku,uyumak,uyutma,yatmadan önce,uykusuzluk", "sleep,sleeping,bedtime,nap,insomnia", "schlaf,schlafen,einschlafen,nickerchen,schlaflosigkeit", "sommeil,dormir,coucher,sieste,insomnie", "sueño,dormir,siesta,insomnio", "sono,dormir,soneca,insônia"),
  relax: C("rahatlama,sakin,huzur,stres,kaygı,sakinleştirici", "relax,calm,peace,stress,anxiety,soothing", "entspannung,ruhe,stress,angst,beruhigend", "détente,calme,paix,stress,anxiété,apaisant", "relajación,calma,paz,estrés,ansiedad,relajante", "relaxamento,calma,paz,estresse,ansiedade,relaxante"),
  focus: C("odak,konsantrasyon,çalışma,ders,verimlilik", "focus,concentration,study,work,productivity", "fokus,konzentration,lernen,arbeit", "concentration,étude,travail", "enfoque,concentración,estudio,trabajo", "foco,concentração,estudo,trabalho"),
  meditation: C("meditasyon,yoga,mindfulness,zihin", "meditation,yoga,mindfulness,breathwork", "meditation,yoga,achtsamkeit", "méditation,yoga,pleine conscience", "meditación,yoga,mindfulness", "meditação,yoga,mindfulness"),
  heart: C("kalp,kalp atışı,nabız,ritim", "heart,heartbeat,pulse,rhythm", "herz,herzschlag,puls,rhythmus", "cœur,battement,pouls,rythme", "corazón,latido,pulso,ritmo", "coração,batimento,pulso,ritmo"),
  breath: C("nefes,solunum,soluk,nefes egzersizi", "breath,breathing,inhale,exhale,breathwork", "atem,atmen,atmung,atemübung", "souffle,respiration,respirer", "aliento,respiración,respirar", "fôlego,respiração,respirar"),
  womb: C("rahim,anne karnı,hamilelik,gebelik", "womb,uterus,pregnancy,in utero", "mutterleib,gebärmutter,schwangerschaft", "utérus,grossesse,in utero", "vientre,útero,embarazo", "útero,gravidez,gestação,barriga"),
  brain: C("beyin dalgası,frekans,ton,hz", "brainwave,frequency,tone,hz,hertz", "gehirnwellen,frequenz,ton", "ondes cérébrales,fréquence,tonalité", "ondas cerebrales,frecuencia,tono", "ondas cerebrais,frequência,tom"),
  headphones: C("kulaklık,stereo", "headphones,earbuds,stereo", "kopfhörer,stereo", "casque,écouteurs,stéréo", "auriculares,cascos,estéreo", "fones,fone de ouvido,estéreo"),
  bowl: C("kase,çan,gong,tibet,şifa,titreşim", "bowl,bell,gong,tibetan,healing,vibration,resonance", "schale,glocke,gong,tibetisch,heilung", "bol,cloche,gong,tibétain,guérison", "cuenco,campana,gong,tibetano,sanación", "tigela,sino,gongo,tibetano,cura"),
  music: C("müzik,melodi,enstrüman,şarkı", "music,melody,instrument,song", "musik,melodie,instrument,lied", "musique,mélodie,instrument,chanson", "música,melodía,instrumento,canción", "música,melodia,instrumento,canção"),
  asmr: C("asmr,karıncalanma,tetikleyici,fısıltı", "asmr,tingles,triggers,tingly", "asmr,kribbeln,trigger", "asmr,frissons,déclencheurs", "asmr,cosquilleo,desencadenantes", "asmr,arrepios,gatilhos"),
  animal: C("hayvan,kuş,böcek,kurbağa,kedi", "animal,bird,insect,frog,cat", "tier,vogel,insekt,frosch,katze", "animal,oiseau,insecte,grenouille,chat", "animal,pájaro,insecto,rana,gato", "animal,pássaro,inseto,sapo,gato"),
  cat: C("kedi,mırıltı,kedi sesi,evcil", "cat,purr,purring,kitten,pet", "katze,schnurren,kater,haustier", "chat,ronron,ronronnement,chaton", "gato,ronroneo,gatito,mascota", "gato,ronronar,gatinho,bichano"),
  frog: C("kurbağa,gölet,bataklık,vıraklama", "frog,toad,pond,swamp,croak", "frosch,kröte,teich,sumpf", "grenouille,crapaud,étang,marais", "rana,sapo,estanque,pantano", "sapo,rã,lagoa,pântano"),
  bird: C("kuş,kuş cıvıltısı,şafak,sabah", "bird,birdsong,chirp,dawn,morning", "vogel,vogelgezwitscher,morgen,dämmerung", "oiseau,chant des oiseaux,aube,matin", "pájaro,canto de pájaros,amanecer,mañana", "pássaro,canto de pássaros,amanhecer,manhã"),
  insect: C("böcek,cırcır böceği,ağustos böceği", "insect,cricket,cicada,crickets,bug", "insekt,grille,zikade", "insecte,grillon,cigale", "insecto,grillo,cigarra", "inseto,grilo,cigarra"),
  winter: C("kış,kar,soğuk,buz,tipi", "winter,snow,cold,ice,blizzard", "winter,schnee,kalt,eis", "hiver,neige,froid,glace", "invierno,nieve,frío,hielo", "inverno,neve,frio,gelo"),
  cozy: C("sıcak,rahat,huzurlu,ev,evde", "cozy,warm,home,indoors,comfort", "gemütlich,warm,zuhause,daheim", "cosy,chaleur,maison,foyer", "acogedor,cálido,casa,hogar", "aconchegante,quente,casa,lar"),
  appliance: C("makine,cihaz,motor,beyaz eşya", "machine,appliance,motor,device", "maschine,gerät,motor", "machine,appareil,moteur", "máquina,aparato,motor", "máquina,aparelho,motor"),
  cleaning: C("temizlik,yıkama,çamaşır,süpürge,toz", "cleaning,washing,laundry,vacuum,dust", "reinigung,waschen,wäsche,staubsaugen", "nettoyage,lavage,linge,aspirateur", "limpieza,lavado,ropa,aspirar", "limpeza,lavagem,roupa,aspirar"),
  clock: C("saat,tik tak,zaman,duvar saati,metronom", "clock,tick,ticking,time,metronome,watch", "uhr,ticken,zeit,metronom", "horloge,tic-tac,temps,métronome,montre", "reloj,tictac,tiempo,metrónomo", "relógio,tique-taque,tempo,metrônomo"),
  heat: C("ısıtıcı,kalorifer,soba,sıcaklık,klima,serin", "heater,heating,radiator,stove,cooling,air conditioning", "heizung,heizkörper,ofen,klima,kühlung", "chauffage,radiateur,poêle,climatisation", "calefacción,radiador,estufa,aire acondicionado", "aquecedor,radiador,fogão,ar-condicionado"),
  fan: C("vantilatör,pervane,hava akımı,serinlik", "fan,airflow,propeller,ventilation", "ventilator,luftstrom,lüftung", "ventilateur,flux d'air,ventilation", "ventilador,flujo de aire,ventilación", "ventilador,fluxo de ar,ventilação"),
  paper: C("kağıt,kitap,sayfa,okuma,defter", "paper,book,page,reading,notebook", "papier,buch,seite,lesen,notizbuch", "papier,livre,page,lecture,cahier", "papel,libro,página,lectura,cuaderno", "papel,livro,página,leitura,caderno"),
  writing: C("yazı,kalem,yazmak,kurşun kalem", "writing,pen,pencil,scribble,handwriting", "schreiben,stift,bleistift,handschrift", "écriture,stylo,crayon", "escritura,pluma,lápiz,escribir", "escrita,caneta,lápis,escrever"),
  brush: C("fırça,fırçalama,saç,tarama,boyama", "brush,brushing,hair,painting,bristles", "bürste,bürsten,haare,pinsel", "brosse,brossage,cheveux,pinceau", "cepillo,cepillado,cabello,pincel", "escova,escovação,cabelo,pincel"),
  sand: C("kum,pirinç,tane,hışırtı,kumsal", "sand,rice,grains,rustle,dune", "sand,reis,körner,rascheln,düne", "sable,riz,grains,froissement,dune", "arena,arroz,granos,crujido,duna", "areia,arroz,grãos,farfalhar,duna"),
  drops: C("damla,damlama,mağara,su damlası", "drop,drip,droplets,dripping,cave", "tropfen,tröpfeln,höhle", "goutte,gouttelettes,grotte", "gota,goteo,cueva", "gota,gotejar,caverna"),
  waterfall: C("şelale,çağlayan,gür su", "waterfall,cascade,falls,rapids", "wasserfall,kaskade", "cascade,chute d'eau", "cascada,catarata,salto de agua", "cachoeira,cascata,queda d'água"),
  tent: C("çadır,kamp,kamp yeri,karavan", "tent,camp,camping,canvas,outdoors", "zelt,camping,lager", "tente,camping,bivouac", "tienda,campamento,camping,acampada", "barraca,camping,acampamento"),
  city: C("şehir,kent,sokak,trafik,kaldırım", "city,urban,street,traffic,town", "stadt,urban,straße,verkehr", "ville,urbain,rue,circulation", "ciudad,urbano,calle,tráfico", "cidade,urbano,rua,trânsito"),
  jungle: C("orman,yağmur ormanı,tropik,cangıl,vahşi", "jungle,rainforest,tropical,wild", "dschungel,regenwald,tropisch", "jungle,forêt tropicale,tropical", "selva,jungla,tropical", "selva,floresta tropical,tropical"),
  chime: C("çan,rüzgar çanı,zil,çıngırak", "chime,chimes,bell,wind chime,tinkle", "windspiel,glocke,klang", "carillon,cloche,tintement", "campanilla,campana,tintineo", "sinos,sino,sininho"),
  piano: C("piyano,tuş,klasik", "piano,keys,classical", "klavier,piano,klassik", "piano,touches,classique", "piano,teclas,clásica", "piano,teclas,clássico"),
  guitar: C("gitar,akustik,tel,akor", "guitar,acoustic,strings,chords", "gitarre,akustik,saiten", "guitare,acoustique,cordes", "guitarra,acústica,cuerdas", "violão,guitarra,acústico,cordas"),
  harp: C("arp,tel,melek", "harp,strings,angelic", "harfe,saiten", "harpe,cordes", "arpa,cuerdas", "harpa,cordas"),
  musicbox: C("müzik kutusu,ninni,kutu,mekanik", "music box,lullaby,mechanical,musicbox", "spieluhr,wiegenlied,mechanisch", "boîte à musique,berceuse,mécanique", "caja de música,nana,mecánica", "caixa de música,cantiga de ninar,mecânica"),
  kalimba: C("kalimba,başparmak piyanosu,afrika", "kalimba,thumb piano,mbira,african", "kalimba,daumenklavier,mbira", "kalimba,piano à pouce,mbira", "kalimba,piano de pulgar,mbira", "kalimba,piano de polegar,mbira"),
  cello: C("çello,yaylı,orkestra", "cello,strings,orchestra,bowed", "cello,streicher,orchester", "violoncelle,cordes,orchestre", "violonchelo,cuerdas,orquesta", "violoncelo,cordas,orquestra"),
  synth: C("sentezleyici,synth,elektronik,pad", "synth,synthesizer,electronic,pad", "synthesizer,elektronisch,pad", "synthétiseur,électronique,pad", "sintetizador,electrónico,pad", "sintetizador,eletrônico,pad"),
  lofi: C("lofi,lo-fi,chill,rahat müzik,beat", "lofi,lo-fi,chill,beats,study music", "lofi,lo-fi,chill,beats", "lofi,lo-fi,chill,beats", "lofi,lo-fi,chill,beats", "lofi,lo-fi,chill,beats"),
  ambient: C("ambiyans,atmosfer,drone,uzay", "ambient,atmosphere,drone,space,soundscape", "ambient,atmosphäre,drone,klanglandschaft", "ambient,atmosphère,drone,paysage sonore", "ambiental,atmósfera,drone,paisaje sonoro", "ambiente,atmosfera,drone,paisagem sonora"),
  keyboard: C("klavye,yazı,tuş,daktilo,bilgisayar,mekanik klavye", "keyboard,typing,keys,typewriter,computer,mechanical", "tastatur,tippen,tasten,schreibmaschine", "clavier,frappe,touches,machine à écrire", "teclado,escribir,teclas,máquina de escribir", "teclado,digitar,teclas,máquina de escrever"),
  tapping: C("tıklama,tıkırtı,parmak,vurma,tırnak,dokunma", "tapping,tap,clicking,fingers,nails,scratching", "klopfen,tippen,fingernagel,kratzen", "tapotement,tapoter,ongles,grattement", "golpeteo,golpecitos,uñas,rascar", "batidas,toques,unhas,arranhar"),
  hairdryer: C("saç kurutma,fön,kurutma makinesi", "hair dryer,hairdryer,blow dryer", "föhn,haartrockner", "sèche-cheveux,sèche cheveux", "secador,secador de pelo", "secador,secador de cabelo"),
};

// Alt kategori -> kavramlar. Mevcut 23 + v1.1'deki 38 = 61 satır.
// İlk kavram (ve sonuna "!" konanlar) BİRİNCİL: o alt kategoriyi tanımlar, aramada
// etiket gibi öne çıkar ("bebek" → önce rahim/kalp atışı/müzik kutusu). Diğerleri ilişkili:
// sonuçta çıkar ama daha altta.
export const SUB_CONCEPTS = {
  // rahatlatıcı
  yagmur: ["rain", "water", "relax", "sleep", "night"],
  cadir_yagmuru: ["rain", "tent!", "cozy", "sleep", "forest"],
  sehir_yagmuru: ["rain", "city!", "night", "cozy"],
  gok_gurultusu: ["storm", "rain", "night", "sleep"],
  deniz: ["sea", "water", "relax", "sleep"],
  gol_kiyisi: ["lake", "water", "relax", "night"],
  dere: ["river", "water", "forest", "relax"],
  selale: ["waterfall", "water", "forest", "river"],
  magara_damla: ["drops", "water", "relax", "asmr"],
  kus_sesi: ["bird", "animal", "forest", "relax"],
  orman: ["forest", "bird", "relax", "night"],
  yagmur_ormani: ["jungle", "rain", "forest", "bird", "animal"],
  ruzgar: ["wind", "night", "relax"],
  cangirak: ["chime", "wind", "relax", "music"],
  kar_kis: ["winter", "wind", "cozy", "night"],
  gece_bocekleri: ["insect", "animal", "night", "forest", "sleep"],
  kurbaga_golet: ["frog", "animal", "lake", "night", "insect"],
  ates: ["fire", "cozy", "relax", "sleep", "night"],
  fon_makinesi: ["hairdryer", "appliance", "noise", "baby!", "sleep"],
  beyaz_gurultu: ["noise", "baby!", "sleep", "focus"],
  kahverengi_gurultu: ["noise", "sleep", "focus", "relax", "baby!"],
  pembe_gurultu: ["noise", "sleep", "focus", "baby"],
  kafe: ["cafe", "focus", "city"],
  // ev
  vantilator: ["fan", "appliance", "noise", "sleep", "baby"],
  klima: ["heat", "appliance", "noise", "sleep"],
  camasir_makinesi: ["cleaning", "appliance", "noise", "baby"],
  supurge: ["cleaning", "appliance", "noise", "baby"],
  saat: ["clock", "cozy", "sleep", "focus"],
  soba_radyator: ["heat", "cozy", "winter", "fire"],
  kedi_murilti: ["cat", "animal", "cozy", "sleep", "relax"],
  // araçlar
  otobus: ["bus", "transport", "city"],
  arac_ici: ["car", "transport", "sleep", "baby"],
  tren: ["train", "transport", "sleep"],
  metro_tramvay: ["metro", "transport", "city"],
  ucak_kabin: ["plane", "transport", "noise", "sleep"],
  gemi_feribot: ["boat", "sea", "transport"],
  tir_kamyon: ["truck", "car", "transport", "night"],
  // beden
  kalp_atisi: ["heart", "baby!", "sleep", "relax", "womb"],
  nefes: ["breath", "meditation!", "relax", "sleep", "baby"],
  rahim: ["womb", "baby!", "heart", "sleep"],
  // frekans
  binaural: ["brain", "headphones!", "meditation", "sleep", "focus"],
  izokronik: ["brain", "meditation", "focus", "sleep"],
  solfeggio: ["brain", "meditation", "relax", "music"],
  tibet_kasesi: ["bowl", "meditation", "relax"],
  gong: ["bowl", "meditation", "music"],
  // asmr
  tiklama: ["tapping", "asmr"],
  klavye: ["keyboard", "asmr", "focus", "writing"],
  sayfa_cevirme: ["paper", "asmr", "focus", "relax"],
  kalem_yazi: ["writing", "paper", "asmr", "focus"],
  firca: ["brush", "asmr", "relax"],
  kum_pirinc: ["sand", "asmr"],
  damla: ["drops", "water", "asmr", "rain"],
  // müzik
  piyano: ["piano", "music", "relax", "sleep"],
  lofi: ["lofi", "music", "focus", "relax"],
  ambient: ["ambient", "music", "relax", "sleep", "meditation"],
  gitar: ["guitar", "music", "relax"],
  arp: ["harp", "music", "relax", "sleep"],
  muzik_kutusu: ["musicbox", "music", "baby!", "sleep"],
  kalimba: ["kalimba", "music", "relax"],
  cello: ["cello", "music", "relax"],
  synth_pad: ["synth", "music", "ambient", "focus"],
};
