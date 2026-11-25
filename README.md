# EAC Vision per Home Assistant

Repository per installare **EAC Vision Home Assistant** dallo Store delle App di Home Assistant OS. Funziona su Raspberry Pi 4 a 64 bit e mini PC x64 con Home Assistant OS.

## Installazione

1. In Home Assistant apri **Impostazioni → App → Installa app**.
2. Dal menu in alto a destra scegli **Repository**.
3. Incolla `https://github.com/gianni7779/eac-vision-home-assistant` e premi **Aggiungi**.
4. Cerca **EAC Vision Home Assistant** nello Store, poi installa e avvia l'app.

Se l'hai già installata, apri la pagina dell'app nello Store, aggiorna il repository dal menu dello Store e premi **Aggiorna** quando compare la versione **0.5.5**. Le impostazioni dell'app restano nella cartella dati di Home Assistant.

Puoi anche aprire direttamente il [collegamento per aggiungere il repository](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fgianni7779%2Feac-vision-home-assistant), scegliere il tuo Home Assistant e confermare l'aggiunta.

Le telecamere vanno aggiunte prima all'integrazione ONVIF di Home Assistant. EAC Vision usa automaticamente il flusso e il profilo di ciascuna entità ONVIF: non devi inserire di nuovo URL o credenziali. L'app legge la configurazione di Home Assistant **in sola lettura** per ottenere questi dati; le credenziali non vengono inviate ai browser. La registrazione H24 è preimpostata; per registrare sul NAS, monta la condivisione in **Impostazioni → Sistema → Archiviazione** come spazio **Media**, poi seleziona il percorso `/media/NOME` nell'app.

Nella scheda **Registrazioni** scegli telecamera e giorno, poi l'orario sulla barra delle 24 ore. Le parti azzurre indicano il video disponibile e i segni grigi i movimenti del sensore ONVIF, quando li attivi nelle impostazioni della telecamera; questa edizione non distingue persone, animali e veicoli. Il lettore ha audio, velocità 0,5×–4× e zoom; l'audio è disponibile nei nuovi file quando la telecamera lo fornisce. Le impostazioni indicano se l'ultima registrazione include una traccia audio. Quando un file finisce, il lettore apre automaticamente il successivo. I file brevi restano un dettaglio interno utile alla registrazione continua e non compaiono come elenco da aprire uno per uno. Il blocco in corso appare nell'archivio solo dopo la chiusura, di norma entro circa un minuto; la durata effettiva dipende dai fotogrammi chiave della camera.

Gli avvisi di movimento tramite Home Assistant Companion sono facoltativi: abilita i movimenti ONVIF nella configurazione della telecamera, poi nelle impostazioni dell'app sul telefono scegli il dispositivo Companion. Gli avvisi arrivano anche con EAC Vision chiusa; con EAC Vision iPhone 1.2.3 il tocco apre il live della camera tramite collegamento all'app.

La vista **Telecamere** mostra l'intero fotogramma senza ritagli. Clicca una camera per aprirla da sola, attivare l'audio se disponibile, andare alle sue registrazioni o usare lo schermo intero. Per collegare l'app EAC Vision fuori casa puoi usare l'IP Tailscale di Home Assistant e la porta 8766; [la guida](eac_vision_pi4/DOCS.md#fuori-casa) spiega anche il caso DuckDNS.

Per configurazione, limiti e prova iniziale su mini PC: [guida completa](eac_vision_pi4/DOCS.md).

Questa versione inoltra e salva i flussi senza AI e senza ricodificare il video. L'audio, se presente, viene convertito in AAC per i file MP4. Il limite configurabile è 16 telecamere; la stabilità effettiva dipende da bitrate, rete, NAS e memoria del dispositivo. Non è ancora stata verificata su un Raspberry Pi o su un'istanza reale di Home Assistant.
