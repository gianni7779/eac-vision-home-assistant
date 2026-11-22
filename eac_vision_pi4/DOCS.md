# EAC Vision Pi 4

Dashboard dentro Home Assistant, importazione delle entità ONVIF e registrazione video continua H24 su disco o NAS. Non usa Frigate né analisi AI. Supporta Home Assistant OS su Raspberry Pi 4 a 64 bit e mini PC x64.

## Primo avvio

1. Aggiungi le telecamere in **Impostazioni → Dispositivi e servizi → ONVIF**. L'app importa solo le entità `camera.*` create dall'integrazione ONVIF.
2. Apri la UI dell'app in Home Assistant e vai in **Impostazioni**. Premere **Aggiorna da HA** se l'elenco non è ancora comparso.
3. Apri ogni telecamera e configura una sorgente diretta `onvif://utente:password@IP:porta` o `rtsp://utente:password@IP:554/percorso`. Home Assistant non fornisce le credenziali ONVIF a questa app. Se la password contiene caratteri speciali come `@` o `:`, codificali in percent encoding nella URL. Le sorgenti sono salvate in `/data` e non vengono inviate ai browser.
4. Seleziona le telecamere da mostrare nella vista Principale.

## Registrazione

Monta un NAS in **Impostazioni → Sistema → Archiviazione** di Home Assistant con uso **Media**. Inserisci nell'app la cartella `/media/NOME_NAS`, già esistente. L'app crea soltanto le sottocartelle delle telecamere. Ogni nuova telecamera configurata ha la registrazione continua H24 preimpostata. La puoi disattivare manualmente. La registrazione riparte dopo il riavvio di Home Assistant e non dipende dal fatto che qualcuno stia guardando il live.

Il registratore prende il flusso condiviso da go2rtc, lo copia in segmenti MP4 di circa 5 minuti e non codifica video. I file contengono solo video H.264; l'audio non viene registrato. Un file in scrittura appare nell'archivio solo quando è stato chiuso correttamente. Se uno stream resta fermo per 45 secondi, il processo viene riavviato. Se il NAS scompare, lo spazio scende sotto 2 GB o la memoria disponibile del Pi scende sotto 256 MB, l'app ferma i processi di registrazione. Li riprende quando la memoria supera 512 MB. Il marker `.eacvision-storage-id` identifica il supporto scelto e impedisce che un NAS smontato venga sostituito silenziosamente dalla cartella locale. I file vengono eliminati secondo i giorni e il limite GB configurati.

## Altri dispositivi EAC Vision

La porta locale **8766** espone l'API EAC Vision NVR. Collega l'IP del Raspberry e il codice mostrato nelle Impostazioni delle app PC/TV/telefono. PC e TV LG/Samsung importano la vista Principale; su Android usa **Vista +** per aggiungere alla vista le telecamere importate. Il live usa WebSocket MSE; le registrazioni sono MP4 accessibili ai client esistenti. La dashboard interna è protetta dall'Ingress di Home Assistant. Non inoltrare la porta 8766 su Internet.

## Capacità

Il limite software è 16 camere configurate. La dashboard mostra tutte quelle selezionate e apre 4 live per impostazione iniziale, con scelta di 8 o 16. Il Raspberry non decodifica i live: lo fanno i dispositivi che guardano. Il risultato reale dipende da bitrate, Wi-Fi/Ethernet e velocità del NAS. Per stabilire quanti flussi regge **il tuo** Raspberry servono una prova con le 8 camere attuali, temperatura, memoria e registri durante la registrazione.

## Problemi comuni

- **Nessuna camera trovata:** verifica che la telecamera sia aggiunta tramite l'integrazione ONVIF di HA e che l'entità camera sia attiva.
- **Live nero:** imposta almeno un profilo H.264 sulla telecamera; se usi `onvif://`, prova il profilo corretto con `?subtype=...` o inserisci la URL RTSP nota.
- **Non registra:** controlla che il NAS sia montato sotto `/media`, che la cartella sia stata salvata nell'app e che restino almeno 2 GB liberi.
- **La registrazione si interrompe:** controlla disco/NAS, spazio libero, memoria disponibile e registro dell'app. L'app riavvia automaticamente un flusso video bloccato.
- **Client non trova il Pi:** controlla IP locale, porta 8766 nelle impostazioni dell'app Home Assistant e codice client.

Riferimenti: [app locali di Home Assistant](https://contributors.home-assistant.io/apps/first-app/), [API Home Assistant per app](https://contributors.home-assistant.io/apps/guides/communication/), [archiviazione di rete](https://www.home-assistant.io/common-tasks/os/#network-storage), [ONVIF](https://www.home-assistant.io/integrations/onvif/), [go2rtc ONVIF](https://github.com/AlexxIT/go2rtc/blob/master/internal/onvif/README.md).
