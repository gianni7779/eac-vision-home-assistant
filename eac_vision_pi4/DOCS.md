# EAC Vision Home Assistant

Dashboard dentro Home Assistant, importazione delle entità ONVIF e registrazione video continua H24 su disco o NAS. Non usa Frigate né analisi AI. Supporta Home Assistant OS su Raspberry Pi 4 a 64 bit e mini PC x64.

## Primo avvio

1. Aggiungi le telecamere in **Impostazioni → Dispositivi e servizi → ONVIF**. L'app importa solo le entità `camera.*` create dall'integrazione ONVIF.
2. Apri la UI dell'app in Home Assistant e vai in **Impostazioni**. Premere **Aggiorna da HA** se l'elenco non è ancora comparso.
3. EAC Vision legge automaticamente il flusso e il profilo di ogni entità dall'integrazione ONVIF. Non inserire di nuovo IP, utente o password della telecamera.
4. Seleziona le telecamere da mostrare nella vista Principale. La registrazione continua è già selezionata e parte quando scegli l'archivio.

Per ottenere il flusso originale senza ricodificarlo tramite Home Assistant, l'app monta la configurazione di Home Assistant **in sola lettura**. Legge solo i dati delle integrazioni ONVIF e abbina ogni entità al suo profilo. I dati di accesso restano nel container dell'app e nel file privato `/data/go2rtc.yaml` (permessi 600); non compaiono nell'interfaccia o nell'API dei client.

## Registrazione

Monta un NAS in **Impostazioni → Sistema → Archiviazione** di Home Assistant con uso **Media**. Inserisci nell'app la cartella `/media/NOME_NAS`, già esistente. L'app crea soltanto le sottocartelle delle telecamere. Ogni nuova telecamera configurata ha la registrazione continua H24 preimpostata. La puoi disattivare manualmente. La registrazione riparte dopo il riavvio di Home Assistant e non dipende dal fatto che qualcuno stia guardando il live.

Il registratore prende il flusso condiviso da go2rtc, lo copia in segmenti MP4 di circa 5 minuti e non codifica video. I file contengono solo video H.264; l'audio non viene registrato. Un file in scrittura appare nell'archivio solo quando è stato chiuso correttamente. Se uno stream resta fermo per 45 secondi, il processo viene riavviato. Se il NAS scompare, lo spazio scende sotto 2 GB o la memoria disponibile del dispositivo scende sotto 256 MB, l'app ferma i processi di registrazione. Li riprende quando la memoria supera 512 MB. Il marker `.eacvision-storage-id` identifica il supporto scelto e impedisce che un NAS smontato venga sostituito silenziosamente dalla cartella locale. I file vengono eliminati secondo i giorni e il limite GB configurati.

Nella UI **Registrazioni** non devi aprire i segmenti uno per uno: seleziona telecamera e giorno, poi tocca l'orario sulla barra. Il blu indica dove esiste un video; puoi anche usare i pulsanti delle ore. Il lettore passa al segmento successivo quando quello in corso termina. Se mancano riprese per un intervallo, la barra lascia vuoto quel tratto e il clic porta al prossimo video disponibile. Il file ancora in scrittura non compare finché non è chiuso.

## Altri dispositivi EAC Vision

La porta locale **8766** espone l'API EAC Vision NVR. Nei client PC/TV/telefono inserisci **l'indirizzo del tuo Home Assistant** nella rete locale, la porta **8766** (non 8123) e il codice mostrato nelle Impostazioni dell'app. PC e TV LG/Samsung importano la vista Principale; su Android usa **Vista +** per aggiungere alla vista le telecamere importate. Il live usa WebSocket MSE; le registrazioni sono MP4 accessibili ai client esistenti. La dashboard interna è protetta dall'Ingress di Home Assistant. Non inoltrare la porta 8766 su Internet.

### Fuori casa

**Tailscale:** attiva Tailscale sia sul dispositivo che ospita Home Assistant sia sul PC o telefono da cui guardi. Nell'app EAC Vision inserisci l'IP Tailscale del dispositivo Home Assistant (di solito `100.x.y.z`) o il suo nome MagicDNS, porta **8766**, e il codice client. La porta deve essere raggiungibile nella tailnet. Puoi verificarlo aprendo `http://100.x.y.z:8766/eacnvr/info` dal dispositivo remoto: deve rispondere con le informazioni del registratore. Se Tailscale è installato solo su un altro dispositivo della rete, usa un subnet router correttamente configurato e l'IP locale di Home Assistant.

**DuckDNS:** il nome DuckDNS normalmente apre Home Assistant sulla porta 8123 o dietro un proxy HTTPS. Questo non rende raggiungibile automaticamente l'API di EAC Vision sulla porta 8766. Per usare EAC Vision dall'app attraverso DuckDNS serve un proxy HTTPS che inoltri `/eacnvr/` all'app e supporti WebSocket per il live e richieste Range per le registrazioni. Il proxy deve limitare gli accessi e non registrare il codice client presente negli URL. Nell'app inserisci l'URL HTTPS del proxy, non il normale URL di Home Assistant sulla porta 8123. Non esporre direttamente la porta 8766 con semplice HTTP. Se non hai già un proxy dedicato, usa Tailscale: non richiede di aprire la porta NVR su Internet.

## Capacità

Le nuove installazioni conservano inizialmente 3 giorni di video. La pulizia controlla l'archivio ogni 5 minuti e cancella prima i segmenti più vecchi, escluso quello in scrittura. Anche senza un limite GB personalizzato, l'app limita le proprie registrazioni all'80% della capacità totale e tenta di lasciare libero almeno il 5% del disco (minimo 2 GB). La conservazione impostata in precedenza non viene cambiata durante un aggiornamento; puoi scegliere 3 giorni nelle Impostazioni. Lo spazio usato, la memoria e la CPU dell'app sono visibili lì. Il codice per i client può essere sostituito con uno di 12-64 caratteri; i client già collegati vanno aggiornati dopo il cambio. Nelle impostazioni della vista puoi nascondere i nomi delle camere nel live.

Il limite software è 16 camere configurate. La dashboard mostra tutte quelle selezionate e apre 4 live per impostazione iniziale, con scelta di 8 o 16. Il Raspberry non decodifica i live: lo fanno i dispositivi che guardano. Il risultato reale dipende da bitrate, Wi-Fi/Ethernet e velocità del NAS. Per stabilire quanti flussi regge **il tuo** Raspberry servono una prova con le 8 camere attuali, temperatura, memoria e registri durante la registrazione.

## Problemi comuni

- **Nessuna camera trovata:** verifica che la telecamera sia aggiunta tramite l'integrazione ONVIF di HA e che l'entità camera sia attiva.
- **Live nero:** verifica che la telecamera riproduca il video in Home Assistant e che il profilo ONVIF usi H.264. Controlla il registro dell'app se il profilo non è disponibile.
- **Non registra:** controlla che il NAS sia montato sotto `/media`, che la cartella sia stata salvata nell'app e che restino almeno 2 GB liberi.
- **La registrazione si interrompe:** controlla disco/NAS, spazio libero, memoria disponibile e registro dell'app. L'app riavvia automaticamente un flusso video bloccato.
- **Client non trova l'app:** controlla l'indirizzo locale di Home Assistant, la porta 8766 nelle impostazioni dell'app e il codice client.

Riferimenti: [app locali di Home Assistant](https://contributors.home-assistant.io/apps/first-app/), [API Home Assistant per app](https://contributors.home-assistant.io/apps/guides/communication/), [archiviazione di rete](https://www.home-assistant.io/common-tasks/os/#network-storage), [ONVIF](https://www.home-assistant.io/integrations/onvif/), [go2rtc ONVIF](https://github.com/AlexxIT/go2rtc/blob/master/internal/onvif/README.md).
