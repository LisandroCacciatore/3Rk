# language: es
@epica-8 @tecnicas
Característica: US-070 — Catálogo mínimo de Técnicas

  Como jugador
  quiero un conjunto acotado de Técnicas con coste elemental
  para que acumular Foco tenga un payoff concreto.

  Cubre FR-070.

  @must @FR-070
  Escenario: El catálogo está definido como datos
    Dado el catálogo de Técnicas del MVP
    Cuando lo consulto
    Entonces contiene Explosión, Doble Tiro, Muro, Reflujo y Disipar
    Y cada Técnica declara nombre, coste elemental, arquetipos habilitados y efecto

  @must @FR-070
  Esquema del escenario: Coste y portadores
    Dado la Técnica "<tecnica>"
    Entonces su coste es "<coste>"
    Y está disponible para "<arquetipos>"

    Ejemplos:
      | tecnica    | coste  | arquetipos       |
      | Explosión  | 🔥🔥   | Peón, Campeón    |
      | Doble Tiro | 🌪️💧   | Alfil            |
      | Muro       | 🌍🌍   | Torre            |
      | Reflujo    | 💧💧   | Alfil, Campeón   |
      | Disipar    | ◼️◼️   | Campeón          |

  @must @FR-070
  Escenario: Una unidad solo accede a las Técnicas de su arquetipo
    Dado una unidad "Torre-1"
    Cuando consulto sus Técnicas disponibles
    Entonces veo Muro
    Y no veo Doble Tiro


@epica-8 @tecnicas
Característica: US-071 — Consumo de tokens al usar una Técnica

  Como jugador
  quiero que la Técnica gaste la energía que preparé
  para que el ciclo de Foco se cierre.

  Cubre FR-071.

  @must @FR-071
  Escenario: La Técnica descuenta los tokens exactos
    Dado un "Campeón-1" con 2 tokens de Fuego y 1 de Agua
    Cuando usa la Técnica Explosión
    Entonces se descuentan sus 2 tokens de Fuego
    Y conserva su token de Agua

  @must @FR-071
  Escenario: Sin tokens suficientes no se puede declarar
    Dado un "Campeón-1" con 1 token de Fuego y sin cartas de Fuego en la mano
    Cuando intento declarar Explosión
    Entonces la Técnica aparece deshabilitada
    Y se indica que falta 1 token de Fuego

  @must @FR-071
  Escenario: Los tokens del elemento equivocado no sirven
    Dado un "Campeón-1" con 2 tokens de Agua
    Cuando intento declarar Explosión
    Entonces la Técnica es rechazada por elemento incorrecto


@epica-8 @tecnicas
Característica: US-072 — Pago mixto con carta

  Como jugador
  quiero completar el coste de una Técnica con una carta del elemento correcto
  para poder usar Técnicas que superan la capacidad de Foco de la unidad.

  Cubre FR-072.

  @must @FR-072
  Escenario: Foco 2 más carta cubren una Técnica de 3 tokens
    Dado una unidad con Foco 2 y 2 tokens de Fuego
    Y una Técnica hipotética que cuesta 3 tokens de Fuego
    Y una carta de Fuego en mi mano
    Cuando declaro la Técnica y aporto la carta
    Entonces la Técnica se ejecuta
    Y se descuentan los 2 tokens
    Y la carta va al descarte

  @must @FR-072
  Escenario: La carta aportada no genera PO
    Cuando aporto una carta para completar el coste de una Técnica
    Entonces esa carta no suma PO a mi reserva
    Y no cuenta como la carta obligatoria del turno

  @must @FR-072
  Escenario: La carta debe ser del elemento requerido
    Dado que solo tengo cartas de Tierra en la mano
    Cuando intento completar con carta el coste de una Técnica de Fuego
    Entonces el aporte es rechazado

  @must @FR-072
  Escenario: El pago mixto solo cubre lo que excede el Foco
    Dado una unidad con Foco 2 y 0 tokens
    Y una Técnica que cuesta 2 tokens de Fuego
    Cuando intento pagarla íntegramente con dos cartas de Fuego
    Entonces el pago es rechazado
    Y se indica que la carta solo cubre el excedente sobre la capacidad de Foco


@epica-8 @tecnicas
Característica: US-073 — Momento de declaración

  Como jugador
  quiero declarar la Técnica al momento de atacar
  para que modifique esa tirada.

  Cubre FR-073 y la decisión D-03. Regla 🟡 de arranque, conmutable.

  @should @FR-073
  Escenario: La Técnica se declara antes de tirar
    Dado que ordeno a "Campeón-1" la acción Atacar
    Cuando se abre el paso de declaración
    Entonces puedo elegir una Técnica disponible o ninguna
    Y una vez que se tiran los dados ya no puedo declararla

  @should @FR-073
  Escenario: La Técnica no consume una acción propia
    Dado que "Campeón-1" no ejecutó acciones este turno
    Cuando ataca declarando Explosión
    Entonces paga solo el coste de la acción Atacar
    Y su contador de acciones queda en 1

  @should @FR-073
  Escenario: Una sola Técnica por ataque
    Cuando declaro una Técnica para un ataque
    Entonces no puedo declarar una segunda Técnica en el mismo ataque

  @should @FR-073
  Escenario: Las Técnicas defensivas se declaran en su propia activación
    Dado la Técnica Muro, que es defensiva
    Cuando la declaro
    Entonces se declara durante mi activación, no durante el ataque enemigo


@epica-8 @tecnicas
Característica: US-074 — Técnica Explosión

  Como jugador de Peón o Campeón
  quiero volver mi ataque más agresivo
  para representar la identidad del Fuego.

  Cubre FR-070. Efecto 🟡: este ataque suma 1 dado al pool y los dados explotan con 9 o 10.

  @must @FR-070
  Escenario: Explosión agrega un dado al pool
    Dado un "Campeón-1" con Ataque 2g2
    Cuando ataca declarando Explosión
    Entonces tira 3 dados
    Y conserva 2

  @must @FR-070
  Escenario: Explosión baja el umbral de explosión
    Dado un ataque con Explosión declarada
    Y un generador que devolverá 9 y 4
    Cuando se resuelve la tirada
    Entonces el dado de 9 explota y suma 13

  @must @FR-070
  Escenario: El umbral rebajado dura solo ese ataque
    Dado que "Campeón-1" atacó declarando Explosión
    Cuando vuelve a atacar en un turno posterior sin declararla
    Entonces sus dados explotan solo con 10


@epica-8 @tecnicas
Característica: US-075 — Técnica Doble Tiro

  Como jugador de Alfil
  quiero impactar a dos enemigos contiguos con un solo disparo
  para representar la identidad de Aire y Agua.

  Cubre FR-070. Efecto 🟡: un ataque a distancia impacta a dos objetivos adyacentes entre sí.

  @must @FR-070
  Escenario: Se seleccionan dos objetivos adyacentes entre sí
    Dado un "Alfil-1" con dos enemigos adyacentes entre sí, ambos en rango y con línea de visión
    Cuando ataca declarando Doble Tiro
    Entonces selecciono ambos objetivos
    Y se resuelve un intercambio contra cada uno, con su propia tirada de defensa

  @must @FR-070
  Escenario: Los objetivos deben ser adyacentes entre sí
    Dado dos enemigos separados por 2 hexágonos
    Cuando intento declarar Doble Tiro sobre ambos
    Entonces la selección es rechazada

  @must @FR-070
  Escenario: Cada objetivo debe cumplir rango y línea de visión
    Dado un segundo objetivo adyacente al primero pero sin línea de visión
    Cuando intento declarar Doble Tiro sobre ambos
    Entonces la selección es rechazada

  @should @FR-070
  Escenario: Un solo resultado adverso basta para el retroceso
    Dado que el atacante pierde el intercambio contra uno de los dos objetivos
    Cuando se resuelven ambos
    Entonces el atacante retrocede una sola vez y queda Stunned una sola vez


@epica-8 @tecnicas
Característica: US-076 — Técnica Muro

  Como jugador de Torre
  quiero blindar mi defensa hasta mi próxima activación
  para representar la identidad de Tierra.

  Cubre FR-070. Efecto 🟡: Keep +1 en Defensa hasta la próxima activación de la unidad.

  @must @FR-070
  Escenario: Muro incrementa el Keep defensivo
    Dado una "Torre-1" con Defensa 2g1 y Muro activo
    Cuando es atacada
    Entonces tira 2 dados y conserva 2

  @must @FR-070
  Escenario: Muro persiste hasta la próxima activación
    Dado una "Torre-1" con Muro activo
    Cuando es atacada dos veces antes de volver a activarse
    Entonces el efecto se aplica en ambas defensas

  @must @FR-070
  Escenario: Muro se apaga al activarse la unidad
    Dado una "Torre-1" con Muro activo
    Cuando la activo y ejecuto cualquier acción
    Entonces el efecto de Muro se remueve

  @should @FR-070
  Escenario: Muro es visible
    Dado una unidad con Muro activo
    Cuando observo el tablero
    Entonces la miniatura muestra un marcador de Muro


@epica-8 @tecnicas
Característica: US-077 — Técnica Reflujo

  Como jugador de Alfil o Campeón
  quiero repetir dados de mi ataque
  para representar la identidad del Agua.

  Cubre FR-070. Efecto 🟡: tras tirar el Ataque, repetir cualquier cantidad de dados, una vez.

  @must @FR-070
  Escenario: Se eligen los dados a repetir después de ver el resultado
    Dado un ataque con Reflujo declarada y una tirada de 2, 7 y 3
    Cuando elijo repetir los dados de 2 y 3
    Entonces esos dos dados se vuelven a tirar
    Y el dado de 7 conserva su valor

  @must @FR-070
  Escenario: Solo una repetición
    Dado que ya repetí dados con Reflujo en este ataque
    Cuando intento repetir de nuevo
    Entonces la opción no está disponible

  @must @FR-070
  Escenario: Un dado repetido puede explotar
    Dado que repito un dado y el generador devuelve 10 y luego 5
    Entonces el dado repetido vale 15

  @should @FR-070
  Escenario: Puedo optar por no repetir nada
    Dado un ataque con Reflujo declarada
    Cuando la tirada me conforma
    Entonces puedo continuar sin repetir ningún dado
    Pero los tokens ya fueron consumidos

  # Aprobado 04/08/2026 (D-17): el tope de cadena es el nivel de Foco, no el tope fijo 20.
  @should @FR-070
  Escenario: Se puede repetir un dado que ya explotó
    Dado un ataque con Reflujo declarada y una tirada de 10 y 4
    Cuando elijo repetir el dado de 10
    Entonces ese dado se vuelve a tirar como un dado normal
    Y puede volver a explotar hasta el nivel de Foco de la unidad


@epica-8 @tecnicas
Característica: US-078 — Técnica Disipar (opcional)

  Como jugador de Campeón
  quiero anular la preparación defensiva del rival
  para representar la identidad del Vacío.

  Cubre FR-070. Prioridad Could: implementar solo si las cuatro anteriores están validadas.
  Efecto 🟡: anula la Técnica defensiva activa del objetivo o le reduce en 1 su dado guardado.

  @could @FR-070
  Escenario: Disipar anula Muro
    Dado un objetivo con Muro activo
    Cuando lo ataco declarando Disipar
    Entonces el efecto de Muro se remueve antes de tirar la defensa

  @could @FR-070
  Escenario: Disipar contra un objetivo sin Técnica defensiva
    Dado un objetivo sin efectos defensivos activos
    Cuando lo ataco declarando Disipar
    Entonces el objetivo conserva un dado guardado menos en esa defensa
    Y nunca baja de 1 dado guardado

  # Aprobado 04/08/2026 (D-14): semántica "anula O reduce", nunca ambos.
  @could @FR-070
  Escenario: Disipar no apila ambos efectos
    Dado un objetivo con Muro activo
    Cuando lo ataco declarando Disipar
    Entonces el Muro se anula antes de tirar la defensa
    Y el dado guardado del objetivo no se reduce además
