# language: es
@epica-0 @andamiaje
Característica: US-000 — Andamiaje del prototipo y estado inicial

  Como desarrollador del prototipo
  quiero un esqueleto de proyecto con el motor separado de la interfaz
  para que cada historia posterior se implemente sin reescribir la base.

  Sin FR asociado. Habilita todas las demás historias.

  Contexto:
    Dado un proyecto creado con Vite y React
    Y una carpeta "src/engine" sin ninguna importación de React ni del DOM
    Y una carpeta "src/ui" sin ninguna regla de juego

  @must
  Escenario: La aplicación arranca y muestra la pantalla de partida
    Dado que el proyecto está instalado
    Cuando ejecuto el servidor de desarrollo y abro la aplicación en el navegador
    Entonces veo un encabezado con el nombre del juego y el número de ronda
    Y veo tres zonas diferenciadas: tablero, panel de jugador y panel de registro
    Y no aparece ningún error en la consola

  @must
  Escenario: El motor expone una única función de entrada
    Dado el módulo "src/engine/index.js"
    Cuando la interfaz necesita modificar la partida
    Entonces lo hace únicamente llamando a "aplicarIntencion(estado, intencion)"
    Y la función devuelve un estado nuevo sin mutar el estado recibido

  @must
  Escenario: Una intención desconocida no rompe la partida
    Dado un estado de partida válido
    Cuando se aplica una intención de tipo "INEXISTENTE"
    Entonces el estado devuelto es idéntico al original
    Y se registra en el log una entrada de tipo "error" con el nombre de la intención

  @must
  Escenario: El estado inicial se crea con una semilla determinista
    Dado que creo una partida con la semilla "playtest-01"
    Cuando creo una segunda partida con la misma semilla
    Entonces ambos estados iniciales son idénticos campo por campo

  @should
  Escenario: El registro de partida acumula eventos en orden
    Dado un estado de partida válido
    Cuando se aplican tres intenciones válidas consecutivas
    Entonces el log contiene tres entradas
    Y cada entrada tiene ronda, turno, actor, tipo y descripción legible
