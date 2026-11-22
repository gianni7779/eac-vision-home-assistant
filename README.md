# EAC Vision per Home Assistant

Repository per installare **EAC Vision Pi 4** dallo Store delle App di Home Assistant OS. Funziona anche su mini PC x64 con Home Assistant OS.

## Installazione

1. In Home Assistant apri **Impostazioni → App → Installa app**.
2. Dal menu in alto a destra scegli **Repository**.
3. Incolla `https://github.com/gianni7779/eac-vision-home-assistant` e premi **Aggiungi**.
4. Cerca **EAC Vision Pi 4** nello Store, poi installa e avvia l'app.

Puoi anche aprire direttamente il [collegamento per aggiungere il repository](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fgianni7779%2Feac-vision-home-assistant), scegliere il tuo Home Assistant e confermare l'aggiunta.

Le telecamere vanno aggiunte prima all'integrazione ONVIF di Home Assistant. EAC Vision usa automaticamente il flusso e il profilo di ciascuna entità ONVIF: non devi inserire di nuovo URL o credenziali. L'app legge la configurazione di Home Assistant **in sola lettura** per ottenere questi dati; le credenziali non vengono inviate ai browser. La registrazione H24 è preimpostata; per registrare sul NAS, monta la condivisione in **Impostazioni → Sistema → Archiviazione** come spazio **Media**, poi seleziona il percorso `/media/NOME` nell'app.

Per configurazione, limiti e prova iniziale su mini PC: [guida completa](eac_vision_pi4/DOCS.md).

Questa versione inoltra e salva i flussi senza AI e senza ricodifica. Il limite configurabile è 16 telecamere; la stabilità effettiva dipende da bitrate, rete, NAS e memoria del dispositivo. Non è ancora stata verificata su un Raspberry Pi o su un'istanza reale di Home Assistant.
