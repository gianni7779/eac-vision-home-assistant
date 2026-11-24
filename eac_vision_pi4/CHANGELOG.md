# Novità

## 0.5.0

- Conservazione iniziale di 3 giorni, pulizia ogni 5 minuti e cancellazione dei video più vecchi quando l'archivio raggiunge il limite o scende sotto la riserva di spazio libero.
- Impostazioni con spazio occupato dalle registrazioni, memoria e CPU usate dal servizio.
- Codice client breve generato automaticamente o personalizzabile (12-64 caratteri).
- Interruttore per nascondere il nome delle telecamere nella griglia live.
- Anteprima video con orario durante il trascinamento della timeline delle registrazioni; il lettore principale passa alla nuova ora quando rilasci.
- Live HLS/fMP4 protetto dal codice client per il lettore iPhone.

## 0.4.0

- Griglia live senza ritaglio o deformazioni: il fotogramma completo conserva le proporzioni originali. Le righe incomplete restano centrate e i riquadri hanno dimensioni uniformi.
- Clic su una telecamera per aprire la vista singola con audio, passaggio tra camere, schermo intero, ricollegamento e accesso alle registrazioni della camera scelta.
- Indicazioni nelle impostazioni per collegarsi fuori casa tramite Tailscale o tramite un proxy HTTPS dedicato quando si usa DuckDNS.

## 0.3.0

- Nuova navigazione con menu laterale su PC e barra inferiore sugli schermi stretti. La vista telecamere resta a schermo pieno e mostra i comandi al passaggio del mouse.
- Schermata Registrazioni con barra delle 24 ore, ore disponibili, ricerca nell'orario scelto e passaggio automatico al video successivo.
- Stato del sistema e impostazioni della vista Principale più chiari.
- Nome **EAC Vision Home Assistant** e icona dell'app. Compatibile con Raspberry Pi 4 a 64 bit e mini PC x64.
- Corretto l'archivio quando una registrazione attraversa la mezzanotte: viene escluso solo il file ancora in scrittura.
