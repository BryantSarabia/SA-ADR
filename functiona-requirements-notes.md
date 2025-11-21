REQUISITI FUNZIONALI
  • Acquisisce dati continuamente dal campo
  • Il sistema deve sincronizzare il modello virtuale con le condizione live . EVENT-DRIVEN ARCHITECTURE?
  • Il sistema deve simulare l'impatto di disruption events
    ○ Chiusure stradali
    ○ Guasti alle infrastrutture -> Identificare questi tipi di failures
  • Il sistema consiglia strategie che mantengono i tempi di risposte dei servizi essenziali quali ospedali, VV.FF e vie di fuga dentro soglie accettabili -> DEFINIRE LE SOGLIE ACCETTABILI
    ○ FARE SOTA PER CAPIRE LE SOGLIE ACCETTABILI
  • Il Twint processerà gli aggiornamenti per tracciare deviamenti dalle condizioni attese
    ○ Incroci bloccati
    ○ Accessibilità ridotta
    ○ Information cascade
                                            
  • Quando vengono rilevate soglie operative critiche, il sistema calcolerà e suggerirà azioni di risposta adattive mirate a minimizzare le interruzioni alla mobilità di emergenza e a mantenere la connettività essenziale
  • Real-time visualisation of the urban state: Live map showing traffic conditions and availability of critical infrastructure
    ○ Mappa 2D della città
    ○ Per visualizzare i distretti all'interno della città possiamo usare geoJSON. Vista la quantità di dati che ci saranno sulla mappa forse ha senso mostrare i geoJSON dei distretti dopo un certo livello di zoom
    
    
  
    ○ Come mostrare le condizioni del traffico sulla mappa?
      § Polylines con diversi colori: rosso (traffico elevato), arancione (traffico medio), verde (traffico basso), altri?
    ○ Disponibilità delle infrastrutture critiche
      § Cosa consideriamo come infrastruttura critica?
        □ Ospedali?
        □ Stazioni della metro?
        □ Fermate degli autobus?
        □ VV.FF?
        □ Questura?
        □ ALTRE?
    ○ Mappa 3D è necessaria? Da quello che abbiamo analizzato finora introdurrebbe solo overhead e forse non fa al nostro use-case.
  • Impact simulation of emergency actions: Evaluation of the effect of interventions (e.g. road closure) before executing them
    ○ AI training come fase iniziale
    ○ Qual è un tempo accettabile di attesa per l'output della simulazione?
      § 5 - 10 secondi in caso di emergenza
      
    ○ Cosa si può simulare?
    ○ Le simulazione sono solo on-demand o event-driven in casi di emergenza?
      § Faremo entrambe
  • Accessibility monitoring for essential services: Alerts when hindered access could delay emergency response.
    ○ Si intende che la strada per arrivare all'ospedale è bloccata dovrebbe venire inviata una notifica
    ○ A chi va inviata la notifica?  Da quello che abbiamo discusso con il professore ci sembra che introdurre una seconda app per i cittadini non converrebbe
      § Definiamo gli user ai quali verrà inviati le notifiche
  • Operational status tracking: Notifications when key infrastructure elements become impaired or disconnected.
      § Prima definiamo cos'è un elemento infrastrutturale chiave
  • The system will support multiple levels of access, reflecting different responsibilities in emergency operations
    ○ District Operator
      § Monitora e gestisce 1 distretto specifico (1:N, un distretto può essere monitorato è gestito da + operatori)
      § Ha accesso a dati operativi dettagliati
        □ Sono dati "grezzi"
          ® Velocità istantanea di ogni veicolo
          ® Volume di veicoli per corsia
          ® Stato di ogni semaforo
          ® Feedback in tempo reale da telecamere specifiche
          ® Posizione GPS di ogni ambulanza
          ® ...
      § Ha accesso a i risltati di simulazione localizzata (simulazione in un'area geografica, quindi visibilità limitata al distretto di appartenenza dell'operatore) -> VUOL DIRE CHE LE SIMULAZIONI VANNO SALVATE E POSSONO ESSERE RIPRODOTTE? 
        □ Simulazione frame a frame o statica? Per statica vogliamo dire immagine situazione iniziale - immagine situazione finale
      § Route intervention actions all'interno del distretto dell'operatore
        □ L'obiettivo è risolvere o prevenire criticità quali congestione, blocchi, emergenze
        □ Ottimizzare la mobilità
        □ Queste azioni sono il risultato dell'analisi dei dati operativi (dati grezzi) e dei risultati delle simulazioni localizzate?
        □ Esempio di azione:
          ® Interventi sui semafori nel caso di incidente. Il sistema modifica i tempi dei semafori in tempo reale. Vale a dire, garantisce il passaggio senza fermate di una ambulanza che si dirige verso l'ospedale, mettendo in verde tutti i semafori nel suo percorso e in rosso gli incroci laterali
          ® Instradamento dinamico... Il sistema suggerisce percorsi alternativi ottimali in tempo reale ai veicoli di soccorso. ESCLUDIAMO I CITTADINI -> SECONDA APP DA FARE -> COSTI E NON è DETTO CHE LA USINO
    ○ City Manager
      § Può vedere multipli distretti -> TUTTI
      § Coordina decisioni cross-distretto
      § Riceve informazioni aggregate sull'accesibilità e può valutare strategie di emergenza più ampie che impattano su più distretti
        □ Non riceve solo i dati grezzi -> Può accedere ai dati operativi dettagliati???
        □ Può spostare mezzi di soccorso da una zona stabile ad un'altra in crisi crescente
        □ Piani di evacuazione di massa
      § Un city manager può fare anche le stesse azioni del District Operator???
      
  • Il sistema deve supportare un funzionamento in tempo reale su un distretto metropolitano, gestendo fino a 5.000 flussi di dati infrastrutturali in tempo reale all'interno di un singolo distretto, elaborando almeno 100.000 eventi di dati al minuto durante le condizioni di emergenza. Gli aggiornamenti della simulazione devono avvenire con un ritardo non superiore a 5-10 secondi rispetto ai cambiamenti nel mondo reale.
  • Il sistema consentirà l'accesso simultaneo fino a 50 opereatori, ciascno con una visualizzazione specifica per il proprio ruolo.
  • Il sistema deve ottimizare i costi senza compromettere la performance.
    ○ Horizontal scaling
    ○ Protocolli di comuncazioni leggeri
    ○ Dobbiamo produrre una stima dei csti
  
