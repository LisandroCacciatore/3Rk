# language: es
@epica-5 @combate @dados
Característica: US-050 — Motor de dados con semilla y explosiones

  Como desarrollador
  quiero un generador de números determinista y dados explosivos
  para poder reproducir cualquier partida de playtest.

  Cubre FR-056. Nota de implementación: el motor NO usa Math.random; recibe un
  generador con semilla, y los tests inyectan una secuencia fija de resultados.

  @must @FR-056
  Escenario: Un dado normal no explota
    Dado un generador que devolverá la secuencia 7
    Cuando tiro un D10
    Entonces el resultado es 7
    Y no se tiran dados adicionales

  @must @FR-056
  Escenario: Un 10 explota y se suma
    Dado un generador que devolverá la secuencia 10, 4
    Cuando tiro un D10
    Entonces el resultado es 14
    Y el detalle de la tirada registra los valores 10 y 4

  @must @FR-056
  Escenario: Las explosiones encadenan
    Dado un generador que devolverá la secuencia 10, 10, 3
    Cuando tiro un D10
    Entonces el resultado es 23

  @must @FR-056
  Escenario: Tope de seguridad de encadenamiento
    Dado un generador que devuelve 10 indefinidamente
    Cuando tiro un D10
    Entonces la cadena se corta en el límite configurado
    Y no se produce un bucle infinito

  @must @FR-056
  Escenario: La misma semilla reproduce la misma partida
    Dado dos partidas con semilla "playtest-01"
    Cuando ejecuto en ambas la misma secuencia de intenciones
    Entonces todas las tiradas coinciden valor por valor


@epica-5 @combate
Característica: US-051 — Tirada Roll and Keep XgY

  Como jugador
  quiero tirar mi pool y conservar mis mejores dados
  para resolver ataque y defensa con la notación XgY.

  Cubre FR-050.

  @must @FR-050
  Escenario: Un 2g1 tira dos dados y conserva uno
    Dado un pool de ataque "2g1"
    Y un generador que devolverá 3 y 8
    Cuando ejecuto la tirada
    Entonces se tiraron 2 dados
    Y se conserva el dado de valor 8
    Y el total es 8

  @must @FR-050
  Escenario: Un 2g2 conserva ambos dados
    Dado un pool de defensa "2g2"
    Y un generador que devolverá 4 y 6
    Cuando ejecuto la tirada
    Entonces el total es 10

  @must @FR-050
  Escenario: Se conservan siempre los dados más altos
    Dado un pool "3g2"
    Y un generador que devolverá 2, 9 y 5
    Cuando ejecuto la tirada
    Entonces se conservan 9 y 5
    Y el total es 14

  @must @FR-050 @FR-056
  Escenario: Un dado explotado se evalúa por su valor acumulado
    Dado un pool "2g1"
    Y un generador que devolverá 10, 2 y 9
    Cuando ejecuto la tirada
    Entonces el primer dado vale 12 y el segundo 9
    Y se conserva el dado de 12


@epica-5 @combate
Característica: US-052 — Resolución del ataque por suma

  Como jugador
  quiero comparar la suma de mis dados guardados contra la del defensor
  para saber quién gana el intercambio.

  Cubre FR-032, FR-051.

  Contexto:
    Dado un atacante "Peón-1" con Ataque 1g1 adyacente al defensor "Peón-2" con Defensa 1g1
    Y que dispongo de PO suficientes

  @must @FR-032
  Escenario: La acción Atacar dispara la resolución completa
    Cuando ataco a "Peón-2"
    Entonces se tira el pool de Ataque del atacante
    Y se tira el pool de Defensa del defensor
    Y se comparan ambas sumas
    Y el resultado queda registrado en el log con el detalle de los dados

  @must @FR-051
  Esquema del escenario: Comparación de sumas
    Dado que el ataque suma <ataque> y la defensa suma <defensa>
    Cuando se resuelve el combate
    Entonces el resultado es "<resultado>"

    Ejemplos:
      | ataque | defensa | resultado     |
      | 9      | 4       | gana ataque   |
      | 4      | 9       | gana defensa  |
      | 6      | 6       | gana defensa  |

  @must @FR-051
  Escenario: No hay dificultad ni conteo de éxitos
    Cuando se resuelve cualquier combate
    Entonces no se compara contra ningún umbral fijo
    Y no se cuentan éxitos individuales


@epica-5 @combate
Característica: US-053 — El atacante gana: herida y eliminación

  Como jugador
  quiero que ganar el intercambio inflija una herida
  para poder eliminar unidades enemigas.

  Cubre FR-052, FR-055, FR-061 y la decisión D-12 (el defensor no queda Stunned).

  @must @FR-052
  Escenario: Una victoria del atacante inflige una herida
    Dado un defensor con Vida 4 y 0 heridas
    Cuando el atacante gana el intercambio
    Entonces el defensor tiene 1 herida
    Y el defensor permanece en su hexágono

  @must @FR-055
  Escenario: No hay segunda tirada de daño
    Cuando el atacante gana el intercambio
    Entonces no se ejecuta ninguna tirada adicional
    Y el daño aplicado es exactamente 1 herida

  @must @FR-061
  Escenario: La unidad muere al alcanzar su Vida en heridas
    Dado un defensor "Peón-2" con Vida 2 y 1 herida
    Cuando el atacante gana el intercambio
    Entonces "Peón-2" es eliminado del tablero
    Y su hexágono queda libre
    Y el log registra la eliminación

  @must @FR-061
  Escenario: Las heridas se muestran en la ficha
    Dado un defensor con Vida 4 y 2 heridas
    Cuando consulto su ficha
    Entonces veo 2 heridas sobre 4 puntos de Vida


@epica-5 @combate
Característica: US-054 — El defensor gana o empate: retroceso y Stunned

  Como jugador
  quiero que atacar mal tenga consecuencias
  para que la agresión no sea siempre gratuita.

  Cubre FR-053, FR-054 y las decisiones D-06 y D-07.

  @must @FR-053
  Escenario: El atacante retrocede un hexágono y queda Stunned
    Dado un atacante en (0, 0) y un defensor en (1, 0)
    Y que el hexágono (-1, 0) está libre
    Cuando el defensor gana el intercambio
    Entonces el atacante queda en (-1, 0)
    Y el atacante tiene el estado Stunned
    Y el defensor no recibe heridas

  @must @FR-054
  Escenario: El empate se resuelve a favor de la defensa
    Dado que ataque y defensa suman lo mismo
    Cuando se resuelve el combate
    Entonces el resultado es idéntico a una victoria del defensor

  @must @FR-053
  Escenario: Retroceso bloqueado por hexágono ocupado
    Dado que el hexágono directamente opuesto al defensor está ocupado
    Y que existe otro vecino libre que se aleja del defensor
    Cuando el defensor gana el intercambio
    Entonces el atacante retrocede a ese vecino libre

  @must @FR-053
  Escenario: Sin retroceso posible
    Dado que ningún vecino que se aleje del defensor está libre
    Cuando el defensor gana el intercambio
    Entonces el atacante permanece en su hexágono
    Y de todos modos queda Stunned

  @must @FR-053
  Escenario: El retroceso no dispara reacciones
    Cuando el atacante retrocede tras perder el intercambio
    Entonces el movimiento no consume PO
    Y no incrementa el contador de acciones del atacante


@epica-5 @combate
Característica: US-055 — Ataque a distancia

  Como jugador
  quiero disparar solo a objetivos dentro de rango y a la vista
  para que la posición importe.

  Cubre FR-042, FR-057.

  Contexto:
    Dado un "Alfil-1" con Rango 3 en (0, 0)

  @must @FR-042
  Escenario: Objetivo dentro de rango
    Dado un enemigo a 3 hexágonos con línea de visión despejada
    Cuando declaro el ataque
    Entonces el ataque se resuelve normalmente

  @must @FR-042
  Escenario: Objetivo fuera de rango
    Dado un enemigo a 4 hexágonos
    Cuando intento declarar el ataque
    Entonces el ataque es rechazado por falta de alcance
    Y no se consume PO

  @must @FR-057
  Escenario: Objetivo sin línea de visión
    Dado un enemigo a 2 hexágonos con un hexágono bloqueado en el trayecto
    Cuando intento declarar el ataque
    Entonces el ataque es rechazado por falta de línea de visión

  @must @FR-042
  Escenario: Una unidad de Rango 1 solo ataca adyacente
    Dado un "Peón-1" con Rango 1
    Cuando intento atacar a un enemigo a 2 hexágonos
    Entonces el ataque es rechazado

  @should @FR-042
  Escenario: Los objetivos válidos se resaltan
    Cuando selecciono la acción Atacar con "Alfil-1"
    Entonces se resaltan los enemigos dentro de rango y con línea de visión
    Y no se resalta ningún otro


@epica-5 @combate
Característica: US-056 — Registro legible del combate

  Como jugador de playtest
  quiero ver el detalle de cada tirada
  para poder responder si el Roll and Keep genera tensión sin sentirse arbitrario.

  Deriva de las preguntas 4 y 5 del playtest (Alcance §6).

  @should
  Escenario: El log detalla la tirada
    Cuando se resuelve un ataque
    Entonces el registro muestra el pool tirado, los dados obtenidos, los guardados,
      las explosiones, las dos sumas y el resultado
    Y las explosiones se distinguen visualmente del resto

  @should
  Escenario: El resultado se anuncia en pantalla
    Cuando se resuelve un ataque
    Entonces aparece un aviso con el resultado antes de que continúe el turno
