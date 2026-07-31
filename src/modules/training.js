// ══════════════════════════════════════════════════════════════════════════
// 11FUT MANAGER - MÓDULO DE ENTRENAMIENTOS, PLANNER, ASISTENCIA Y MÉDICO
// ══════════════════════════════════════════════════════════════════════════

import { perfil, categoriasData, plantel, setCategoriaActiva, autoSaveLocal } from './state.js';
import { guardarFirebase } from '../services/firebase.js';
import { mostrarNotificacionApp } from './config.js';

// BASE DE DATOS DE 70 EJERCICIOS (35 COMPETITIVOS + 35 FORMATIVOS)
export const EJERCICIOS_DB = [
  // ──────────────────────────────────────────────────────────────────────────
  // 🎮 JUEGOS LÚDICOS Y RECREATIVOS (5 FORMATIVOS + 5 COMPETITIVOS)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'lud_f1',
    title: 'Tres en Raya Humano a Velocidad',
    level: 'formativo',
    cat: 'ludico',
    dur: '12 min',
    desc: 'Carrera de relevos por equipos de 3 jugadores. Cada equipo sale en velocidad desde la línea de partida llevando un peto distintivo. Al llegar a la cuadrícula de conos de 3x3m ubicada a 15 metros, deben colocar el peto en un casillero estratégico y regresar para dar el relevo chocado de manos al siguiente compañero. Gana el primer equipo que logre formar una línea recta de 3 petos (horizontal, vertical o diagonal). Si tras colocar 3 petos no hay ganador, el cuarto corredor debe mover un peto de su propio color a un casillero adyacente libre.',
    rules: '1. Salida estricta tras la línea tras chocar manos con el compañero. 2. Si hay 3 petos colocados en cancha, los siguientes corredores deben mover un peto existente a un casillero vacío. 3. Prohibido lanzar el peto a distancia; debe colocarse con la mano.',
    materials: '🎒 9 Conos Bajos Chinos (Cuadrícula 3x3), 6 Petos de 2 Colores Diferentes (3 Verdes + 3 Rojos), 1 Silbato',
    img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'lud_f2',
    title: 'El Zorro y los Cazadores de Balón',
    level: 'formativo',
    cat: 'ludico',
    dur: '10 min',
    desc: 'Se delimita un cuadrado de 20x20 metros. Un jugador seleccionado (designado como "El Zorro") conduce su balón dentro del área e intenta tocar con la mano la espalda de los demás niños. Todos los demás jugadores ("Los Cazadores") conducen libremente su propio balón tratando de esquivar al Zorro mientras intentan con la vista arriba quitarle el balón al Zorro de un puntapié suave. Si el Zorro toca a alguien o le quitan el balón, el rol cambia inmediatamente.',
    rules: '1. El Zorro debe mantener la pelota pegada al pie en todo momento mientras persigue. 2. Quien se salga del límite de 20x20m se convierte automáticamente en Zorro. 3. Fomentar la protección de balón con el cuerpo.',
    materials: '🎒 1 Balón por Jugador (12-16 Balones N°4/5), 8 Conos de Delimitación Zonal, 1 Peto Fluorescente de Zorro',
    img: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'lud_f3',
    title: 'Robo de Colas con Conducción',
    level: 'formativo',
    cat: 'ludico',
    dur: '15 min',
    desc: 'Cada niño conduce su balón dentro del rectángulo de juego llevando una cinta o peto colgado en la parte trasera de la cintura (cola). El objetivo es quitarle la cinta trasera a los compañeros utilizando la mano libre, sin descuidar el control del propio balón al pie. Al robar una cinta, el jugador se la coloca en la cintura acumulando "vidas".',
    rules: '1. Quien pierda la cinta y su balón debe salir 30 segundos fuera del cuadro a realizar 5 dominadas antes de reingresar. 2. Prohibido usar los brazos para empujar o empuñar la cinta. 3. Gana el jugador con más cintas acumuladas.',
    materials: '🎒 16 Cintas/Petos para Cintura, 1 Balón por Jugador, 8 Conos Chinos de Esquina',
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'lud_f4',
    title: 'Fútbol-Tenis Adaptado Infantil',
    level: 'formativo',
    cat: 'ludico',
    dur: '15 min',
    desc: 'Enfrentamiento en parejas en minicanchas de 6x4m divididas por una red baja de 80cm o una fila de conos altos. Cada pareja dispone de un máximo de 3 toques entre ellos y se permite 1 pique en el suelo antes de devolver la pelota al campo contrario con el pie, muslo o cabeza.',
    rules: '1. Permitido máximo 1 pique entre toques de la misma pareja. 2. El saque se efectúa de volea desde la línea de fondo. 3. Obligatorio que ambos integrantes toquen el balón antes de pasarlo al campo rival.',
    materials: '🎒 2 Redes Bajas de Fútbol-Tenis (o 8 Conos Altos de 50cm), 4 Balones N°4/5 con Presión Adecuada, 1 Cinta Métrica',
    img: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'lud_f5',
    title: 'Derribar el Cono del Castillo',
    level: 'formativo',
    cat: 'ludico',
    dur: '12 min',
    desc: 'Dos equipos frente a frente separados por una franja neutral de 5 metros a una distancia de 15 metros. En la franja central se colocan 5 conos altos (el Castillo). Los jugadores de ambos lados deben realizar pases rasos potentes e intencionados intentando golpear y derribar los conos centrales. Cada cono derribado otorga 1 punto.',
    rules: '1. Prohibido invadir la franja neutral central. 2. Los disparos deben ser estrictamente rasantes. 3. El equipo que derribe el último cono gana la ronda.',
    materials: '🎒 5 Conos Altos de 40cm (Castillo), 12 Conos Bajos de Franja, 6 Balones N°4/5',
    img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'lud_c1',
    title: 'Rondo Recreativo 7v2 a Un Toque',
    level: 'competitivo',
    cat: 'ludico',
    dur: '12 min',
    desc: 'Rondo de integración en círculo de 10 metros de diámetro. 7 jugadores exteriores mueven la pelota a 1 solo toque obligatorio mientras 2 defensores centrales buscan interceptar. Si los exteriores completan 20 pases seguidos, los 2 defensores pagan una prenda recreativa (5 flexiones o pasarela). Si hay un caño (túnel), el jugador afectado suma 1 ronda extra adentro.',
    rules: '1. Obligatorio jugar a 1 solo toque. 2. Si el pase es defectuoso y sale del círculo, entra al centro quien dio el mal pase. 3. Fomentar la velocidad de circulación y el buen ambiente.',
    materials: '🎒 10 Conos de Círculo, 4 Balones N°5 de Competición, 2 Petos para Defensores',
    img: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'lud_c2',
    title: 'Fútbol Vóley de Competición 3v3',
    level: 'competitivo',
    cat: 'ludico',
    dur: '15 min',
    desc: 'Partido 3v3 en cancha de 8x6m con red suspendida a 2.20 metros de altura. No se permite ningún pique en el suelo. Los jugadores deben controlar y pasar utilizando únicamente el pecho, muslo, cabeza y volea de pie. Ideal para sesiones de recuperación post-partido o activación técnica de alta coordinación.',
    rules: '1. Máximo 3 toques por equipo sin que la pelota toque el césped. 2. El punto termina si el balón toca el suelo o la red. 3. Saque aéreo desde el fondo.',
    materials: '🎒 1 Red de Vóley Ajustable (2.20m), 4 Balones de Competición N°5, 6 Petos de 2 Colores',
    img: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'lud_c3',
    title: 'Desafío del Travesaño en Grupo',
    level: 'competitivo',
    cat: 'ludico',
    dur: '10 min',
    desc: 'Competencia de golpeo de precisión a 20 metros de la portería dividida en 2 equipos. Cada jugador realiza 3 lanzamientos alternados buscando pegarle al travesaño con diferentes superficies (borde interno, empeine total, rosca). Cada impacto directo en el larguero suma 2 puntos. El equipo perdedor se encarga de recoger los balones y estacas del entrenamiento.',
    rules: '1. El disparo debe ejecutarse tras la línea de 20m en balón parado o en leve movimiento. 2. El bote previo en el suelo anula el punto.',
    materials: '🎒 1 Portería Reglamentaria con Travesaño, 10 Balones Oficiales N°5, 2 Conos de Fila',
    img: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'lud_c4',
    title: 'Pádel-Fútbol de Parejas',
    level: 'competitivo',
    cat: 'ludico',
    dur: '15 min',
    desc: 'Juego dinámico por parejas utilizando vallas o paredes perimetrales de rebote en cancha reducida de 10x6m. El balón debe rebotar obligatoriamente en la pared antes de pasar al campo rival, exigiendo controles orientados instantáneos de pecho o muslo.',
    rules: '1. Máximo 2 toques por jugador. 2. El gol que proviene de rebote directo en pared vale 2 puntos. 3. Mantener cadencia máxima.',
    img: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'lud_c5',
    title: 'Relevos Combinados de Habilidad',
    level: 'competitivo',
    cat: 'ludico',
    dur: '12 min',
    desc: 'Circuito por equipos: Estación 1 (10 dominadas en movimiento sin caer), Estación 2 (eslalon veloz entre 6 estacas), Estación 3 (pase de precisión a mini-portería de 25 metros). Tras acertar, el jugador esprinta a dar la mano a su compañero de fila.',
    rules: '1. Si la pelota toca el suelo en las dominadas, el jugador debe reiniciar la estación. 2. Gana el equipo con menor tiempo total de ronda.',
    materials: '🎒 12 Estacas de Eslalon, 2 Mini-Porterías, 6 Balones N°5, 1 Cronómetro',
    img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=500&q=80'
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ⚡ ACTIVACIÓN NEUROMUSCULAR PRE-ENTRENAMIENTO (5 FORMATIVOS + 5 COMPETITIVOS)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'pre_e_f1',
    title: 'Simón Dice Neuromuscular Infantil',
    level: 'formativo',
    cat: 'pre_entreno',
    dur: '10 min',
    desc: 'Los niños trotan suavemente en espacio libre. A la señal del entrenador mediante conos de colores levantados (Cono Azul = Salto dos pies, Cono Verde = Skipping rápido 3s, Cono Rojo = Freno seco e isometría de 2s), realizan la respuesta motriz inmediata sin chocar.',
    rules: '1. Reacción en menos de 1 segundo tras la señal visual. 2. Mantener la cabeza erguida buscando espacios libres. 3. Excelente trabajo de prevención coordinativo.',
    materials: '🎒 4 Conos de Colores (Azul, Verde, Rojo, Amarillo), 12 Conos de Perímetro, 1 Silbato',
    img: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_e_f2',
    title: 'Escalera de Coordinación + Conducción Rápida',
    level: 'formativo',
    cat: 'pre_entreno',
    dur: '12 min',
    desc: 'Recorrido coordinativo: Pasadas en escalera de agilidad (1 dentro 1 fuera, paso lateral de frecuencia de apoyos) + salida explosiva a buscar un balón colocado en un cono + conducción veloz de 10 metros y pase raso al compañero que espera en fila.',
    rules: '1. Apoyos veloces sobre metatarsos sin pisar los peldaños. 2. Conducción con la mirada levantada. 3. Rotación continua por filas.',
    materials: '🎒 2 Escaleras de Coordinación (6m), 8 Conos Chinos, 6 Balones N°4/5',
    img: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_e_f3',
    title: 'Movilidad Articular Dinámica en Círculo',
    level: 'formativo',
    cat: 'pre_entreno',
    dur: '8 min',
    desc: 'Círculo general de equipo. Secuencia guiada de movilidad activa: aductores hacia adentro/afuera, balanceo frontal y lateral de pierna, paso cruzado y skipping progresivo del 50% al 90%. Prepara la cápsula articular y eleva la temperatura corporal.',
    rules: '1. Movimientos fluidos sin estiramientos estáticos prolongados. 2. Respiración rítmica coordinada.',
    materials: '🎒 10 Conos Bajos para Marcar Círculo, 1 Silbato',
    img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_e_f4',
    title: 'Rondo 3v1 con Estímulo Visual de Colores',
    level: 'formativo',
    cat: 'pre_entreno',
    dur: '10 min',
    desc: 'Rondo suave en 8x8m. El entrenador se ubica fuera del cuadro levantando conos de colores. El jugador que va a dar el pase debe cantar en voz alta el color del cono visible antes de entregar el balón a 2 toques rasos.',
    rules: '1. Estimular la visión periférica obligando a desglosar la mirada del balón. 2. Pases rasos bien perfilados.',
    materials: '🎒 4 Conos de Colores para el Entrenador, 4 Conos de Rondo (8x8m), 4 Balones N°4/5, 1 Peto',
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_e_f5',
    title: 'Esquiva de Conos y Salto de Vallas Bajas',
    level: 'formativo',
    cat: 'pre_entreno',
    dur: '10 min',
    desc: 'Circuito lúdico pliométrico con 4 mini-vallas infantiles de 15cm (saltos a dos pies) + eslalon de agilidad + esprint final de 5 metros a controlar un balón en movimiento enviado por el DT.',
    rules: '1. Recepción suave amortiguada en saltos sobre metatarsos. 2. Aceleración con la vista arriba al salir de las vallas.',
    materials: '🎒 4 Mini-Vallas Infantiles (15cm), 6 Conos Chinos, 4 Balones N°4/5',
    img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_e_c1',
    title: 'Activación con Bandas Elásticas y Pliometría',
    level: 'competitivo',
    cat: 'pre_entreno',
    dur: '12 min',
    desc: 'Estaciones de activación neuromuscular profunda: Trabajo de glúteo medio y estabilidad de rodilla utilizando minibands elásticas en tobillos + saltos unipodales en hexágono pliométrico con caída amortiguada.',
    rules: '1. Enfoque preventivo de rodilla e isquiotibiales (LCA). 2. 3 series de 6 repeticiones por pierna.',
    materials: '🎒 6 Minibands de Resistencia Media/Alta, 2 Hexágonos Pliométricos, 6 Conos',
    img: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_e_c2',
    title: 'Pases Dinámicos de Tensión Progresiva',
    level: 'competitivo',
    cat: 'pre_entreno',
    dur: '10 min',
    desc: 'Parejas a 10 metros desplazándose lateralmente en paralelo. Intercambio de pases tensos a 1 toque aumentando progresivamente la fuerza del golpeo con borde interno.',
    rules: '1. Control tenso de primera sin que la pelota se levante. 2. Cadencia de desplazamiento constante.',
    materials: '🎒 8 Conos de Pasillo Lateral, 4 Balones N°5 Oficiales',
    img: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_e_c3',
    title: 'Circuito de Agilidad con Cambio de Dirección (COD)',
    level: 'competitivo',
    cat: 'pre_entreno',
    dur: '12 min',
    desc: 'Recorrido veloz en Z con conos colocados a 45 grados. Énfasis en la desaceleración fuerte con la pierna exterior, inclinación de tronco y aceleración explosiva en el nuevo ángulo.',
    rules: '1. Centro de gravedad bajo en las curvas. 2. Apoyo fuerte sobre pie exterior.',
    materials: '🎒 8 Conos Chinos de Agilidad, 1 Cronómetro, 4 Balones N°5',
    img: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_e_c4',
    title: 'Rondo Posicional 4v2 con Cambios de Ritmo',
    level: 'competitivo',
    cat: 'pre_entreno',
    dur: '10 min',
    desc: 'Rondo en espacio reducido (6x6m) a 1 toque. Al silbato del DT, los 4 exteriores rompen en esprint de 10 metros fuera de la celda y regresan a presionar en cambio de rol.',
    rules: '1. Máxima velocidad de circulación en el rondo. 2. Reacción inmediata al silbato.',
    materials: '🎒 6 Conos de Celda 6x6m, 2 Petos de Color, 4 Balones N°5',
    img: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_e_c5',
    title: 'Core Estabilidad + Pase Aéreo de Cabeza',
    level: 'competitivo',
    cat: 'pre_entreno',
    dur: '10 min',
    desc: 'Estaciones de plancha isométricas (frontal/lateral) activando pared abdominal y zona lumbar por 15 segundos + incorporación explosiva para devolver 3 balones aéreos de cabeza lanzados por el compañero.',
    rules: '1. Mantener bloque lumbar neutro en la plancha. 2. Golpeo de cabeza con ojos abiertos e impulso de cuello.',
    materials: '🎒 4 Colchonetas/Esterillas, 6 Balones N°5 Oficiales',
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80'
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 🔥 ACTIVACIÓN NEUROMUSCULAR PRE-PARTIDO (5 FORMATIVOS + 5 COMPETITIVOS)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'pre_p_f1',
    title: 'Rondo Alegre Pre-Partido Niños 5v2',
    level: 'formativo',
    cat: 'pre_partido',
    dur: '8 min',
    desc: 'Rondo dinámico de integración a 2 toques sin presión asfixiante, enfocado en activar la confianza, la soltura y las buenas sensaciones tácticas del grupo titular minutos antes de ingresar a competir.',
    rules: '1. Aplaudir y alentar cada secuencia de 5 pases. 2. Comunicación alegre y enfoque positivo.',
    materials: '🎒 6 Conos de Rondo, 2 Petos, 3 Balones N°4/5',
    img: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_p_f2',
    title: 'Aceleraciones de 5m con Salida al Silbato',
    level: 'formativo',
    cat: 'pre_partido',
    dur: '6 min',
    desc: 'Filas de 3 jugadores alineados tras la línea de banda. Al silbato del DT, arrancan los 3 en paralelo a máxima velocidad durante 5 metros, frenando progresivamente en los siguientes 5 metros.',
    rules: '1. Salida en explosión con apoyo de metatarso. 2. Mantener la alineación en paralelo.',
    materials: '🎒 6 Conos de Salida y Llegada, 1 Silbato',
    img: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_p_f3',
    title: 'Paredes y Tiros a Puerta de Animación',
    level: 'formativo',
    cat: 'pre_partido',
    dur: '10 min',
    desc: 'El entrenador se ubica como pared fija en la medialuna del área. El jugador le entrega un pase raso tenso, recibe la devolución de primera y remata colocado buscando el poste lejano de la portería.',
    rules: '1. Rematar raso buscando la red lateral. 2. El portero calienta blocajes bajos de calentamiento.',
    materials: '🎒 1 Portería Principal, 10 Balones Oficiales de Partido, 4 Conos',
    img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_p_f4',
    title: 'Circuito de Pases Cruzados en Octógono',
    level: 'formativo',
    cat: 'pre_partido',
    dur: '8 min',
    desc: '8 jugadores titulares se ubican en los vértices de un octógono e intercambian pases cruzados a 2 toques activando la comunicación verbal firme llamándose por su nombre ("¡Mía!", "¡Voy!").',
    rules: '1. Nombre obligatorio antes de pasar. 2. Control orientado perfilado hacia el siguiente pase.',
    materials: '🎒 8 Conos de Octógono, 4 Balones N°4/5',
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_p_f5',
    title: 'Juego de Reacción "Toca el Cono Rápido"',
    level: 'formativo',
    cat: 'pre_partido',
    dur: '6 min',
    desc: 'En parejas frente a frente a 1 metro de distancia con un balón sobre un cono entre ambos. El DT nombra zonas del cuerpo (cabeza, rodillas, tobillos). Al gritar "¡BALÓN!", gana quien agarre la pelota primero.',
    rules: '1. Máxima atención e intensidad auditiva. 2. Competencia sana y risas activadoras.',
    materials: '🎒 6 Conos Chinos, 6 Balones N°4/5',
    img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_p_c1',
    title: 'Calentamiento Específico Competitivo de Posesión 6v6',
    level: 'competitivo',
    cat: 'pre_partido',
    dur: '12 min',
    desc: 'Mini-partido de posesión en 20x20m titulares vs suplentes a 1-2 toques buscando replicar el ritmo, la presión tras pérdida y la agresividad táctica que encontrarán en el partido oficial.',
    rules: '1. Presión tras pérdida en menos de 4 segundos. 2. Intensidad real de partido al 100%.',
    materials: '🎒 8 Conos de Delimitación, 6 Petos de Titular, 6 Balones Oficiales de Partido',
    img: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_p_c2',
    title: 'Esprint Progresivo con Frenado y Aceleración Secundaria',
    level: 'competitivo',
    cat: 'pre_partido',
    dur: '6 min',
    desc: 'Pasadas de 10m al 80% de intensidad + freno seco e isometría + aceleración secundaria al 100% por 5 metros para simular disputas intensas de balones divididos.',
    rules: '1. 4 repeticiones por jugador con 45s de pausa activa entre pasadas.',
    materials: '🎒 6 Conos de Pasada, 1 Cronómetro, 1 Silbato',
    img: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_p_c3',
    title: 'Ensayo de Basculación y Centro-Remate Progresivo',
    level: 'competitivo',
    cat: 'pre_partido',
    dur: '10 min',
    desc: 'La defensa de 4 titulares realiza basculaciones coordinadas a lo ancho del área mientras los extremos doblan por banda lanzando centros con rosca para el remate aéreo del 9 y llegada del volante.',
    rules: '1. Sincronizar el desmarque de ruptura al segundo palo. 2. Voz de mando del portero ("¡Mía!").',
    materials: '🎒 1 Portería Oficial, 10 Balones N°5 de Partido, 4 Petos Defensivos',
    img: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_p_c4',
    title: 'Rondo de Tensión 4v2 con Cambios de Orientación',
    level: 'competitivo',
    cat: 'pre_partido',
    dur: '8 min',
    desc: 'Rondo de alta frecuencia. Al completar 6 pases seguidos a 1 toque, el poseedor debe conectar un cambio de frente largo de 25m hacia la otra celda donde aguarda la segunda línea.',
    rules: '1. Balón tenso por el aire. 2. Control de pecho/muslo obligatorio del receptor.',
    materials: '🎒 8 Conos de Celda Doble (25m de distancia), 4 Balones de Competición, 4 Petos',
    img: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_p_c5',
    title: 'Activación de Porteros: Disparos de Reacción en Corto',
    level: 'competitivo',
    cat: 'pre_partido',
    dur: '10 min',
    desc: 'El preparador de porteros ejecuta remates potentes a quemarropa desde 7-8 metros con desvíos previos en mini-vallas para activar los reflejos, la agilidad de manos y la recuperación baja del guardameta.',
    rules: '1. Postura agazapada con centro de gravedad bajo. 2. Desviar siempre hacia las bandas fuera del área chica.',
    materials: '🎒 2 Mini-Vallas para Rebote de Balón, 8 Balones Oficiales de Partido N°5',
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80'
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 🎯 TÁCTICA & POSESIÓN (6 FORMATIVOS + 6 COMPETITIVOS)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'tac_f1',
    title: 'Juego de los 4 Portales (Pase Filtrado)',
    level: 'formativo',
    cat: 'tactica',
    dur: '15 min',
    desc: 'Partido 4v4 en cuadrado de 20x20m con 4 pequeñas porterías de conos (portales) ubicadas en el interior. Se logra gol cruzando o filtrando un pase raso a través de cualquier portal a un compañero desmarcado.',
    rules: '1. Buscar constantemente la espalda de la marca. 2. Cambios de orientación hacia el portal desguarnecido.',
    materials: '🎒 8 Conos para 4 Portales, 8 Conos de Perímetro, 8 Petos (4 Verdes + 4 Rojos), 6 Balones N°4/5',
    img: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tac_f2',
    title: 'Conservación de Balón 3v3 + 2 Comodines por Banda',
    level: 'formativo',
    cat: 'tactica',
    dur: '15 min',
    desc: 'Mantener la posesión del balón apoyándose en 2 jugadores comodines neutrales colocados a lo largo de las líneas laterales. Los comodines juegan siempre a favor del equipo poseedor del balón.',
    rules: '1. Los comodines juegan a 1 solo toque. 2. Obligatorio conectar con ambas bandas antes de intentar gol.',
    materials: '🎒 12 Conos de Campo, 2 Petos Amarillos para Comodines, 6 Balones N°4/5',
    img: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tac_f3',
    title: 'Ataque vs Defensa 3v2 en Cancha Reducida',
    level: 'formativo',
    cat: 'tactica',
    dur: '15 min',
    desc: '3 atacantes arrancan en velocidad desde la línea media contra 2 defensores centrales. Si la defensa logra robar el balón, deben cruzar la línea de mitad de campo conduciendo limpiamente.',
    rules: '1. Finalizar la jugada de ataque en menos de 12 segundos. 2. Fijar marcas para generar pase al libre.',
    materials: '🎒 1 Portería Reglamentaria, 6 Conos de Marcación, 6 Balones N°4/5, 5 Petos',
    img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tac_f4',
    title: 'Desmarque Básico: Ruptura y Apoyo',
    level: 'formativo',
    cat: 'tactica',
    dur: '15 min',
    desc: 'Ejercicio 2 atacantes contra 1 defensor. Un atacante se acerca a pedir el balón al pie (apoyo) atrayendo la marca del defensor, mientras el segundo atacante ataca explosivamente el espacio libre a la espalda (ruptura).',
    rules: '1. Contacto visual previo al desmarque. 2. Pase al pie o al espacio según el movimiento del receptor.',
    materials: '🎒 8 Conos de Pasillo, 6 Balones N°4/5, 3 Petos',
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tac_f5',
    title: 'Batalla de Zonas 4v4 (Sin Amontonarse)',
    level: 'formativo',
    cat: 'tactica',
    dur: '15 min',
    desc: 'El terreno de juego se divide en 4 cuadrantes. En cada cuadrante debe haber inicialmente 1 atacante y 1 defensor. Se enseña a los niños la ocupación racional del espacio prohibiendo amontonarse.',
    rules: '1. No puede haber más de 2 compañeros en el mismo cuadrante. 2. Conectar pases entre cuadrantes.',
    materials: '🎒 16 Conos para Delimitar 4 Cuadrantes, 8 Petos (4 Azules + 4 Rojos), 6 Balones N°4/5',
    img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tac_f6',
    title: 'Transición Rápida 2v1 Acompañado',
    level: 'formativo',
    cat: 'tactica',
    dur: '12 min',
    desc: 'Inicia un duelo 1v1 hacia el marco. A los 3 segundos se incorpora un segundo atacante desde la retaguardia obligando al delantero poseedor a decidir rápidamente entre encarar o filtrar el pase.',
    rules: '1. Tomar la decisión de pase o tiro en menos de 5 segundos. 2. Reacción inmediata.',
    materials: '🎒 1 Portería, 6 Conos de Marcación, 6 Balones N°4/5',
    img: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tac_c1',
    title: 'Juego de Posición 4v4 + 3 Comodines (Estilo Guardiola)',
    level: 'competitivo',
    cat: 'tactica',
    dur: '20 min',
    desc: 'Posesión táctica en 25x25m. 3 comodines (Pivote central interior y 2 Extremos fijadores en banda) garantizan la superioridad numérica constante 7v4 para el equipo en posesión del balón.',
    rules: '1. Encontrar siempre al tercer hombre libre. 2. Presión tras pérdida inmediata en menos de 4 segundos.',
    materials: '🎒 12 Conos de Perímetro, 3 Petos Amarillos para Comodines, 6 Balones N°5 Oficiales',
    img: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tac_c2',
    title: 'Salida de Balón 4v3 bajo Presión Alta',
    level: 'competitivo',
    cat: 'tactica',
    dur: '20 min',
    desc: 'Línea defensiva (2 Centrales + 2 Laterales) con el Portero iniciando juego desde el fondo raso contra 3 delanteros rivales que presionan alto. El objetivo es filtrar el pase a espaldas de los presionantes.',
    rules: '1. Atraer la marca antes de soltar el pase. 2. Si el rival roba, dispone de 6 segundos para definir.',
    materials: '🎒 1 Portería Principal, 10 Conos de Marcación, 3 Petos para Presionantes, 6 Balones N°5',
    img: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tac_c3',
    title: 'Repliegue Defensivo en Bloque Medio-Bajo 4v4+2',
    level: 'competitivo',
    cat: 'tactica',
    dur: '20 min',
    desc: 'Línea de 4 defensores sincronizando basculación y achique espacio-temporal cuando el rival intenta filtrar pases interlineales. Mantener la distancia entre defensores reducida a un máximo de 8 metros.',
    rules: '1. Distancia interdefensiva máxima: 8m. 2. Achicar hacia el poseedor solo cuando este controle de espaldas.',
    materials: '🎒 12 Conos de Franja Defensiva, 6 Petos de Color, 6 Balones N°5 Oficiales',
    img: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tac_c4',
    title: 'Transición Ofensiva Rápida tras Robo (Contraataque)',
    level: 'competitivo',
    cat: 'tactica',
    dur: '18 min',
    desc: 'Robo de balón en campo propio y despliegue vertical inmediato de 3 atacantes a máxima velocidad contra 2 defensas que replegan desesperadamente. Finalizar la jugada en menos de 8 segundos.',
    rules: '1. Máximo 3 pases antes de rematar a puerta. 2. Transición vertical en menos de 8 segundos.',
    materials: '🎒 1 Portería Reglamentaria, 8 Conos de Transición, 6 Balones Oficiales N°5',
    img: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tac_c5',
    title: 'Ataque Organizado contra Bloque Bajo (Centro y Remate)',
    level: 'competitivo',
    cat: 'tactica',
    dur: '20 min',
    desc: 'Circulaciones pacientes de balón de lado a lado para desorganizar al rival cerrado en su área chica. Doblar por banda con lateral volante y sacar centro raso o tenso para 3 rematadores a diferentes alturas.',
    rules: '1. Buscar la ventaja 2v1 en banda. 2. Cargar el área con 3 atacantes atacando el primer y segundo palo.',
    materials: '🎒 1 Portería Reglamentaria, 10 Conos, 6 Petos Defensivos, 8 Balones N°5',
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tac_c6',
    title: 'Presión Tras Pérdida Caza-Balón (Gegenpressing)',
    level: 'competitivo',
    cat: 'tactica',
    dur: '18 min',
    desc: 'Espacio reducido de 15x15m. Tras perder el balón, los 3 jugadores más cercanos saltan a asfixiar al poseedor rival en menos de 3 segundos para recuperar la pelota inmediatamente en zona alta.',
    rules: '1. Acortar líneas de pase cerrando el embudo. 2. Si no se recupera en 5s, armar bloque de nuevo.',
    materials: '🎒 8 Conos de Perímetro, 6 Petos de 2 Colores, 6 Balones N°5',
    img: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=500&q=80'
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ⚽ TÉCNICA & REMATE / FUNDAMENTOS BASE (6 FORMATIVOS + 6 COMPETITIVOS)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'tec_f1',
    title: 'Circuito de Pase Interior y Control Orientado',
    level: 'formativo',
    cat: 'tecnica',
    dur: '15 min',
    desc: 'Estaciones en triángulo a 10m de distancia. El jugador A entrega pase raso a B con borde interno, B ejecuta control orientado perfilando hacia su pierna hábil y entrega a C a 2 toques.',
    rules: '1. Atacar la pelota antes de recibirla. 2. Cambiar de perfil de recepción en cada vuelta.',
    materials: '🎒 3 Conos Chinos de Vértice, 4 Balones N°4/5',
    img: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tec_f2',
    title: 'Eslalon de Conducción con Múltiples Superficies',
    level: 'formativo',
    cat: 'tecnica',
    dur: '12 min',
    desc: 'Recorrido técnico entre 6 conos alineados a 1.5m de distancia. El niño conduce alternando empeine exterior para esquivar y borde interno para recortar, manteniendo la mirada levantada.',
    rules: '1. Mirada erguida entre cono y cono. 2. Obligatorio utilizar ambas piernas alternadamente.',
    materials: '🎒 6 Conos Chinos o Estacas, 1 Balón por Jugador N°4/5',
    img: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tec_f3',
    title: 'Centros a media altura y Volea Rrasa Infantil',
    level: 'formativo',
    cat: 'tecnica',
    dur: '15 min',
    desc: 'Pase bombeado suave desde la esquina del área hacia el punto penal. El delantero ingresa en carrera e impacta de primera de volea rasa con empeine antes de que el balón toque el suelo.',
    rules: '1. Apuntar abajo buscando las esquinas de la portería. 2. Mantener el tronco inclinado sobre el balón.',
    materials: '🎒 1 Portería Principal, 8 Balones N°4/5, 4 Conos de Posición',
    img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tec_f4',
    title: 'Duelo 1v1 con Amagos y Regates Clásicos',
    level: 'formativo',
    cat: 'tecnica',
    dur: '15 min',
    desc: 'Pasillo estrecho (8x15m). El atacante encara al defensor aplicando fintas corporales, bicicleta o cambio de ritmo para desbordar y rematar dentro de los 3 segundos posteriores a la superación.',
    rules: '1. Si supera al rival tiene 3 segundos para definir. 2. El defensor suma punto si roba limpiamente.',
    materials: '🎒 6 Conos de Pasillo, 1 Mini-Portería o Portería Principal, 6 Balones N°4/5',
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tec_f5',
    title: 'Cabezazo Técnico con Salto Unipodal',
    level: 'formativo',
    cat: 'tecnica',
    dur: '12 min',
    desc: 'El compañero lanza suavemente el balón con las manos desde 5 metros. El rematador salta con un solo pie (salto unipodal), impacta con la frente manteniendo los ojos abiertos y pica el balón al suelo.',
    rules: '1. Golpeo con la frente, nunca con la coronilla. 2. Dirigir la trayectoria hacia abajo.',
    materials: '🎒 6 Balones N°4/5, 4 Conos de Posición',
    img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tec_f6',
    title: 'Controles Aéreos con Muslo y Pecho',
    level: 'formativo',
    cat: 'tecnica',
    dur: '12 min',
    desc: 'Pases por alto en parejas a 12 metros de distancia. Los niños deben amortiguar la caída de la pelota con el muslo o pecho, dejándola acomodada al pie para devolverla mediante un pase raso.',
    rules: '1. Absorber el impacto relajando la zona de contacto. 2. Prohibido tocar la pelota con los brazos.',
    materials: '🎒 4 Conos de Fila, 6 Balones N°4/5',
    img: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tec_c1',
    title: 'Circuito de Paredes en Corto y Definición Rápida',
    level: 'competitivo',
    cat: 'tecnica',
    dur: '15 min',
    desc: 'Secuencia de doble pared rápida 1-2 al borde del área a 1 solo toque, finalizando con un disparo colocado con rosca al segundo palo del marco defensivo.',
    rules: '1. Pase tenso y preciso al pie del pivot. 2. Definición al palo lejano del portero.',
    materials: '🎒 1 Portería Oficial, 10 Balones N°5 Oficiales, 4 Conos de Pivot',
    img: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tec_c2',
    title: 'Centro Tenso en Carrera + Remate de Cabeza Picado',
    level: 'competitivo',
    cat: 'tecnica',
    dur: '18 min',
    desc: 'El extremo pisa línea de fondo y lanza un centro tenso con rosca hacia afuera. El centrodelantero realiza el desmarque entre centrales e impacta con un cabezazo picado contra el piso.',
    rules: '1. Centro bombeado entre portero y central. 2. Remate de cabeza potente hacia el césped.',
    materials: '🎒 1 Portería Reglamentaria, 12 Balones Oficiales de Partido N°5, 6 Conos',
    img: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tec_c3',
    title: 'Remates tras Giro y Desmarque en Espacio Reducido',
    level: 'competitivo',
    cat: 'tecnica',
    dur: '15 min',
    desc: 'El delantero recibe de espaldas al marco con un defensa pegado a la marca. Debe realizar un giro explosivo sobre su eje orientado hacia su pierna hábil y disparar a gol en menos de 1.5 segundos.',
    rules: '1. Proteger el balón con el cuerpo antes de girar. 2. Disparo instantáneo al arco.',
    materials: '🎒 1 Portería Reglamentaria, 8 Balones Oficiales N°5, 2 Petos Defensivos',
    img: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tec_c4',
    title: 'Pases Largos de Precisión de 35 Metros',
    level: 'competitivo',
    cat: 'tecnica',
    dur: '15 min',
    desc: 'Parejas situadas a 35 metros de distancia ensayando cambios de orientación por el aire impactando con el empeine total sin que el balón haga roscas descontroladas, con recepción orientada a 1 toque.',
    rules: '1. Control orientado instantáneo del receptor. 2. Trayectoria limpia y tensa del pase aéreo.',
    materials: '🎒 8 Conos de Pasillo, 6 Balones N°5 Oficiales de Competición',
    img: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tec_c5',
    title: 'Mano a Mano 1v1 contra el Portero con Presión Trasera',
    level: 'competitivo',
    cat: 'tecnica',
    dur: '15 min',
    desc: 'El delantero parte con 2 metros de ventaja en carrera hacia la portería, perseguido por un defensa central. Debe resolver el mano a mano ante la salida del arquero en menos de 3 toques.',
    rules: '1. Resolver en máximo 3 toques. 2. Decidir según el achique entre vaselina, regate o disparo bajo.',
    materials: '🎒 1 Portería Principal, 10 Balones N°5, 4 Petos',
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tec_c6',
    title: 'Volea Acrobática tras Rechace de Cabeza',
    level: 'competitivo',
    cat: 'tecnica',
    dur: '15 min',
    desc: 'El balón sale despejado de cabeza desde el área chica hacia la frontal. El mediocampista ingresa en carrera y remata de volea sin dejar picar el balón en el suelo.',
    rules: '1. Coordinación ojo-pie impecable. 2. Mantener la mirada fija en el balón hasta el impacto.',
    materials: '🎒 1 Portería Reglamentaria, 10 Balones Oficiales N°5, 4 Conos',
    img: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=500&q=80'
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 🛡️ BALÓN PARADO / ABP (4 FORMATIVOS + 4 COMPETITIVOS)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'abp_f1',
    title: 'Saque de Banda Táctico en Corto y Apoyo',
    level: 'formativo',
    cat: 'abp',
    dur: '10 min',
    desc: 'Enseñar la técnica reglamentaria correcta del saque de banda (ambas manos detrás de la cabeza, ambos pies apoyados en el suelo) buscando la recepción en corto del lateral y la devolución en pared.',
    rules: '1. Prohibido levantar los pies del suelo al sacar. 2. Ofrecer siempre dos opciones de pase claro.',
    materials: '🎒 6 Balones N°4/5, 6 Conos de Línea de Banda',
    img: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'abp_f2',
    title: 'Córner Infantil en Corto con Dos Jugadores',
    level: 'formativo',
    cat: 'abp',
    dur: '12 min',
    desc: 'Ejecución del tiro de esquina mediante un pase corto al compañero que se acerca al banderín para engañar a la defensa y lanzar un centro raseado peligroso al área chica.',
    rules: '1. Engañar simulando disparo directo. 2. Centro potente al área chica a ras de césped.',
    materials: '🎒 1 Banderín de Córner, 1 Portería Principal, 6 Balones N°4/5',
    img: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'abp_f3',
    title: 'Falta Lateral Básica con Marca Zonal',
    level: 'formativo',
    cat: 'abp',
    dur: '12 min',
    desc: 'Enseñar a los defensores infantiles a alinearse en marca zonal mirando el balón y saliendo a atacarlo en lugar de quedarse estáticos al momento del lanzamiento lateral rival.',
    rules: '1. Despejar siempre hacia los laterales fuera del área. 2. Comunicación del portero ("¡Mía!").',
    materials: '🎒 1 Portería Principal, 8 Balones N°4/5, 6 Petos Defensivos',
    img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'abp_f4',
    title: 'Tiro Libre Infantil sobre Barrera Baja',
    level: 'formativo',
    cat: 'abp',
    dur: '10 min',
    desc: 'Práctica de tiro libre directo a 16 metros con una barrera infantil de 2 muñecos/conos altos, aprendiendo a superar la altura con rosca interior buscando la escuadra.',
    rules: '1. Pie de apoyo firme al lado del balón. 2. Acompañar el golpeo con el cuerpo.',
    materials: '🎒 2 Muñecos/Conos Altos para Barrera (1.5m), 1 Portería, 8 Balones N°4/5',
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'abp_c1',
    title: 'Córner Táctico con Bloqueo y Cortina al Primer Palo',
    level: 'competitivo',
    cat: 'abp',
    dur: '15 min',
    desc: 'Movimiento ensayado donde 2 atacantes realizan bloqueo al marcador central rival para liberar al rematador principal que ingresa como un rayo a peinar el balón al primer palo.',
    rules: '1. Salida en abanico coordinada al silbato del cobrador. 2. Buscar la peinada al 2° palo.',
    materials: '🎒 1 Banderín de Córner, 1 Portería Oficial, 10 Balones N°5 de Competición, 6 Petos',
    img: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'abp_c2',
    title: 'Tiro Libre Frontal con Jugador Oculto tras Barrera',
    level: 'competitivo',
    cat: 'abp',
    dur: '15 min',
    desc: 'Estrategia donde un atacante se coloca agachado en la barrera rival y se abre justo antes del impacto, permitiendo filtrar un remate raso sorpresivo directo al gol.',
    rules: '1. Sincronización milimétrica del movimiento de barrera. 2. Remate raso potente.',
    materials: '🎒 4 Muñecos de Barrera Inflable, 1 Portería Oficial, 10 Balones Oficiales N°5',
    img: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'abp_c3',
    title: 'Saque de Banda Ofensivo Directo al Área Chica (Lanzador)',
    level: 'competitivo',
    cat: 'abp',
    dur: '12 min',
    desc: 'Saque de banda largo lanzado con ambas manos hacia el punto penal para peinar de cabeza hacia atrás, buscando la entrada furiosa de la segunda línea de volantes.',
    rules: '1. Peinar con la zona occipital. 2. Los extremos atacan los rebotes al segundo palo.',
    materials: '🎒 8 Balones Oficiales de Partido N°5, 6 Petos, 1 Cinta Métrica',
    img: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'abp_c4',
    title: 'Defensa de Córner Mixta (Zonal + Marcas Hombre)',
    level: 'competitivo',
    cat: 'abp',
    dur: '15 min',
    desc: 'Organización defensiva mixta: 3 mejores cabeceadores defienden la zona chica frontal + 3 defensores realizan marca al hombre pegada sobre los rematadores peligrosos rivales.',
    rules: '1. No perder de vista la marca asignada. 2. Salida rápida en bloque al despejar.',
    materials: '🎒 1 Portería Oficial, 1 Banderín de Córner, 8 Balones N°5 Oficiales, 6 Petos',
    img: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=500&q=80'
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 🏃‍♂️ FÍSICO, COORDINACIÓN & PSICOMOTRICIDAD (4 FORMATIVOS + 4 COMPETITIVOS)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'fis_f1',
    title: 'Circuito Psicomotor de Aros y Salto Infantil',
    level: 'formativo',
    cat: 'fisico',
    dur: '15 min',
    desc: 'Circuito coordinativo: Paso por aros (pata coja y dos pies), salto consecutivo sobre mini-vallas de 20cm y aceleración suave de 8 metros para rematar a portería.',
    rules: '1. Coordinación motriz antes que velocidad pura. 2. Caída con rodillas flexionadas.',
    materials: '🎒 6 Aros Psicomotores, 4 Mini-Vallas (20cm), 1 Portería, 6 Balones N°4/5',
    img: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'fis_f2',
    title: 'Carrera de Relevos con Conducción en Zig-Zag',
    level: 'formativo',
    cat: 'fisico',
    dur: '12 min',
    desc: 'Carrera por equipos sorteando hileras de estacas en zig-zag a máxima velocidad llevando el balón pegado al pie hasta la meta y regresando.',
    rules: '1. Entregar el balón al compañero de fila antes de cruzar la línea. 2. Diversión y máximo esfuerzo.',
    materials: '🎒 12 Estacas de Eslalon, 4 Balones N°4/5, 1 Silbato',
    img: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'fis_f3',
    title: 'Juego de Agilidad "El Espejo"',
    level: 'formativo',
    cat: 'fisico',
    dur: '10 min',
    desc: 'Parejas frente a frente a 2 metros de distancia. El atacante realiza movimientos laterales rápidos de vaivén y el defensor debe imitar sus movimientos en espejo sin perder la postura.',
    rules: '1. Mantener posición defensiva flexionada. 2. Cambios de ritmo repentinos.',
    materials: '🎒 8 Conos Bajos de Marcación, 1 Silbato',
    img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'fis_f4',
    title: 'Caza de Banderines con Reacción Rápida',
    level: 'formativo',
    cat: 'fisico',
    dur: '12 min',
    desc: 'Jugadores echados boca abajo en la línea de partida. Al silbato se incorporan en explosión y esprintan 10m a atrapar un banderín en el centro (hay 1 banderín menos que jugadores).',
    rules: '1. Salida rápida desde la posición tendida. 2. Competencia sana y potencia de piernas.',
    materials: '🎒 5 Banderines o Conos Altos de Objetivo, 1 Silbato',
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'fis_c1',
    title: 'Circuito Intermitente Neuromuscular con Balón (RSA)',
    level: 'competitivo',
    cat: 'fisico',
    dur: '18 min',
    desc: 'Estaciones de alta intensidad en 12 segundos: Esprint 15m + Freno seco + Pase tenso + Pliometría en vallas de 30cm + Tiro a puerta bajo fatiga aeróbica.',
    rules: '1. Pausa de recuperación 1:3 entre pasadas. 2. Mantener la técnica limpia bajo fatiga.',
    materials: '🎒 6 Vallas Pliométricas (30cm), 8 Conos, 1 Portería, 6 Balones N°5, 1 Cronómetro',
    img: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'fis_c2',
    title: 'Resistencia Específica 1v1 Continuo con Transición',
    level: 'competitivo',
    cat: 'fisico',
    dur: '15 min',
    desc: 'Duelo 1v1 exhaustivo durante 45 segundos seguidos. Apenas el balón sale del rectángulo, el DT introduce otro balón inmediatamente para exigir resistencia anaeróbica láctica.',
    rules: '1. Exigencia anaeróbica máxima. 2. Mantener la intensidad defensiva sin faltas.',
    materials: '🎒 8 Conos de Perímetro, 10 Balones Oficiales N°5, 2 Petos, 1 Cronómetro',
    img: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'fis_c3',
    title: 'Fuerza Explosiva: Arrastre de Trineo / Liga + Esprint',
    level: 'competitivo',
    cat: 'fisico',
    dur: '15 min',
    desc: 'Carrera de 5 metros con resistencia de liga elástica sujetada por un compañero desde atrás + liberación del arnés para esprintar libremente 10 metros en velocidad pura.',
    rules: '1. Postura de zancada potente con tronco inclinado. 2. Transferencia a la aceleración limpia.',
    materials: '🎒 2 Ligas de Resistencia Elástica con Cinturón, 6 Conos de Marcación, 1 Cronómetro',
    img: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'fis_c4',
    title: 'Frenado Excéntrico y Prevención de Isquiotibiales (Nordic Hamstring)',
    level: 'competitivo',
    cat: 'fisico',
    dur: '12 min',
    desc: 'Ejercicio nórdico preventivo de isquiotibiales de rodillas sobre colchoneta, frenando la caída del tronco hacia adelante mediante contracción excéntrica con asistencia del compañero sujetando tobillos.',
    rules: '1. Mantener la cadera extendida en todo momento. 2. 3 series de 5 repeticiones lentas.',
    materials: '🎒 4 Colchonetas de Protección, 1 Silbato',
    img: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=500&q=80'
  }
];

// ESTADO INTERNO DEL MÓDULO DE ENTRENAMIENTOS
let currentLevelFilter = 'all';
let currentCatFilter = 'all';
let modalLevelFilter = 'all';
let modalCatFilter = 'all';

export function getEntrenamientosData() {
  const catObj = categoriasData[perfil.categoriaActiva] || {};
  if (!catObj.sesiones) catObj.sesiones = [];
  if (!catObj.asistencia) catObj.asistencia = {};
  if (!catObj.lesiones) catObj.lesiones = {};
  if (!catObj.customDrills) catObj.customDrills = [];
  return catObj;
}

// MAPEO DE NOMBRES Y BADGES DE CATEGORÍAS
const CAT_MAP = {
  ludico: { name: '🎮 Juegos Lúdicos & Recreativos', color: '#50e3c2' },
  pre_entreno: { name: '⚡ Activación Neuromuscular Pre-Entreno', color: 'var(--oro)' },
  pre_partido: { name: '🔥 Activación Neuromuscular Pre-Partido', color: '#ff5252' },
  tactica: { name: '🎯 Táctica & Posesión', color: '#4a90e2' },
  tecnica: { name: '⚽ Técnica & Remate', color: '#e65100' },
  abp: { name: '🛡️ Balón Parado (ABP)', color: '#9c27b0' },
  fisico: { name: '🏃‍♂️ Físico, Coordinación & Psicomotricidad', color: '#00ab55' }
};

// ══════════════════════════════════════════════════════════════════════════
// HELPER PARA LISTADO DE MATERIALES RECOMENDADOS POR EJERCICIO
// ══════════════════════════════════════════════════════════════════════════
export function getDrillMaterials(d) {
  if (d && d.materials) return d.materials;
  const cat = d ? d.cat : 'tactica';
  const title = d ? (d.title || '') : '';

  if (title.includes('Tres en Raya')) return '🎒 9 Conos Chinos (3x3), 6 Petos de 2 Colores Diferentes, 1 Silbato';
  if (title.includes('Zorro')) return '🎒 8 Conos de Delimitación de Área, 1 Balón por Jugador (12-16 Balones N°4/5), 1 Peto Distintivo';
  if (title.includes('Robo de Colas')) return '🎒 1 Balón por Jugador, 16 Cintas / Petos Flexibles para Cintura, 8 Conos Bajos';
  if (title.includes('Tenis') || title.includes('Vóley')) return '🎒 1 Red Baja de Fútbol-Tenis (o 6 Conos Altos), 4 Balones N°5, 1 Cinta Métrica';
  if (title.includes('Castillo')) return '🎒 5 Conos Altos de 40cm (Objetivos), 12 Conos de Franja, 6 Balones Raso N°5';
  if (title.includes('Travesaño')) return '🎒 1 Portería Reglamentaria, 10 Balones N°5, 4 Conos de Posición de Disparo (20m)';
  if (title.includes('Pádel')) return '🎒 2 Paredes/Vallas de Rebote Rígidas, 4 Balones de Competición, 6 Conos';
  if (title.includes('Escalera')) return '🎒 1 Escalera de Coordinación de 6m, 4 Conos Chinos, 6 Balones N°5';
  if (title.includes('Bandas') || title.includes('Pliometría')) return '🎒 6 Minibands de Resistencia Elástica, 1 Hexágono Pliométrico (o 6 Vallas Bajas), 4 Conos';
  if (title.includes('Eslalon')) return '🎒 6 Estacas de Eslalon (1.5m) o Conos Altos, 1 Balón por Jugador N°4/5';
  if (title.includes('Córner')) return '🎒 1 Banderín de Córner, 1 Portería Reglamentaria, 6 Balones de Partido N°5, 6 Petos';
  if (title.includes('Tiro Libre') || title.includes('Falta')) return '🎒 4 Muñecos de Barrera Defensiva (o 4 Conos Altos de 1.8m), 8 Balones Oficiales N°5';
  if (title.includes('Trineo') || title.includes('Liga')) return '🎒 2 Ligas de Resistencia Elástica con Arnés/Cinturón, 4 Conos de Aceleración';
  if (title.includes('Salida')) return '🎒 1 Portería Principal, 12 Conos de Marcación Zonal, 8 Petos (2 Colores), 6 Balones N°5';
  if (title.includes('Centro')) return '🎒 1 Portería Reglamentaria, 12 Balones Oficiales de Partido, 8 Conos Chinos';

  if (cat === 'ludico') return '🎒 10 Conos Bajos, 8 Petos (2 Colores), 6 Balones N°4/5, 1 Silbato';
  if (cat === 'pre_entreno') return '🎒 1 Escalera de Coordinación, 4 Mini-Vallas (15cm), 4 Minibands Elásticas, 6 Conos';
  if (cat === 'pre_partido') return '🎒 12 Conos de Marcación, 10 Petos Titular/Suplente, 6 Balones Oficiales de Partido';
  if (cat === 'tactica') return '🎒 16 Conos de Delimitación, 10 Petos (3 Colores Comodín), 6 Balones N°5, 4 Mini-Arcos';
  if (cat === 'tecnica') return '🎒 10 Conos Chinos, 6 Estacas de Eslalon, 8 Balones Oficiales, 1 Portería Reglamentaria';
  if (cat === 'abp') return '🎒 1 Banderín de Córner, 4 Muñecos/Barrera Inflable, 6 Balones de Partido N°5, 1 Cinta';
  if (cat === 'fisico') return '🎒 6 Vallas Pliométricas (30cm), 8 Aros Psicomotores, 1 Liga de Resistencia, 1 Cronómetro';

  return '🎒 10 Conos, 6 Petos, 4 Balones N°5, 1 Silbato';
}

// ══════════════════════════════════════════════════════════════════════════
// GENERADOR DE HTML DE TARJETAS DE EJERCICIO CON EXPLICACIÓN DETALLADA Y MATERIALES
// ══════════════════════════════════════════════════════════════════════════
function buildDrillCardHTML(d, accentColor) {
  const catInfo = CAT_MAP[d.cat] || { name: d.cat, color: '#fff' };
  const materialsList = getDrillMaterials(d);

  return `
    <div style="background:#111;border:1px solid #222;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;transition:transform 0.2s, border-color 0.2s;" onmouseenter="this.style.borderColor='${accentColor}';this.style.transform='translateY(-3px)';" onmouseleave="this.style.borderColor='#222';this.style.transform='translateY(0)';">
      
      <!-- PORTADA CON IMAGEN DE ALTA CALIDAD Y BADGES -->
      <div style="height:120px;background:url('${d.img}') center/cover no-repeat;position:relative;border-bottom:1px solid #222;">
        <div style="position:absolute;top:6px;left:6px;background:rgba(0,0,0,0.85);color:#fff;padding:3px 8px;border-radius:10px;font-size:9px;font-weight:800;border:1px solid ${catInfo.color};">
          ${d.level === 'formativo' ? '👦 FORMATIVO' : '🏆 COMPETITIVO'}
        </div>
        <div style="position:absolute;bottom:6px;right:6px;background:rgba(0,0,0,0.85);color:var(--oro);padding:3px 8px;border-radius:6px;font-size:10px;font-weight:700;">
          ⏱️ ${d.dur}
        </div>
      </div>

      <div style="padding:12px;display:flex;flex-direction:column;flex:1;justify-content:space-between;gap:8px;">
        <div>
          <h4 style="font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:800;color:#fff;margin:0 0 4px 0;">${d.title}</h4>
          <p style="font-size:11px;color:#ccc;line-height:1.4;margin:0 0 6px 0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${d.desc}</p>
          
          <div style="font-size:10px;color:var(--oro);background:#1a1400;padding:4px 8px;border-radius:6px;border:1px solid rgba(255,215,0,0.3);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${materialsList}
          </div>
        </div>

        <div style="display:flex;gap:6px;margin-top:8px;">
          <button onclick="window._verDetalleEjercicio('${d.id}')" style="flex:1;background:#1a1a1a;border:1px solid #333;color:#eee;padding:7px 8px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">🔍 Ver Detalle & Materiales</button>
          <button onclick="window._agregarEjercicioASesion('${d.id}')" style="background:var(--verde-campo);border:none;color:#000;padding:7px 10px;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;">+ Añadir</button>
        </div>
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════════════════
// RENDERIZADO DE LA BIBLIOTECA EN LA PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
export function renderBibliotecaEjercicios() {
  const container = document.getElementById('drills-library-grid');
  if (!container) return;

  const catObj = getEntrenamientosData();
  const allDrills = [...EJERCICIOS_DB, ...(catObj.customDrills || [])];

  const filtered = allDrills.filter(d => {
    const matchLevel = (currentLevelFilter === 'all') || (d.level === currentLevelFilter);
    const matchCat = (currentCatFilter === 'all') || (d.cat === currentCatFilter);
    return matchLevel && matchCat;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:#777;font-size:14px;">No hay ejercicios que coincidan con los filtros seleccionados.</div>`;
    return;
  }

  const formativos = filtered.filter(d => d.level === 'formativo');
  const competitivos = filtered.filter(d => d.level === 'competitivo');

  const renderSection = (title, levelIcon, drillsList, accentColor) => {
    if (drillsList.length === 0) return '';

    const subcats = ['ludico', 'pre_entreno', 'pre_partido', 'tactica', 'tecnica', 'abp', 'fisico'];

    const subSectionsHtml = subcats.map(subKey => {
      const items = drillsList.filter(d => d.cat === subKey);
      if (items.length === 0) return '';

      const catInfo = CAT_MAP[subKey] || { name: subKey, color: '#fff' };
      const cardsHtml = items.map(d => buildDrillCardHTML(d, accentColor)).join('');

      return `
        <div style="margin-bottom:20px;">
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:800;color:${catInfo.color};margin-bottom:10px;display:flex;align-items:center;gap:6px;border-bottom:1px solid #222;padding-bottom:4px;">
            <span>${catInfo.name}</span>
            <span style="font-size:11px;color:#777;">(${items.length} ejercicios)</span>
          </div>

          <!-- GRILLA DE 3 COLUMNAS LIMPIAS -->
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));gap:12px;">
            ${cardsHtml}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div style="background:#0a0a0a;border:1px solid #222;border-radius:12px;padding:16px;margin-bottom:20px;">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:900;color:${accentColor};margin-bottom:14px;display:flex;align-items:center;gap:8px;border-bottom:2px solid ${accentColor};padding-bottom:6px;">
          <span>${levelIcon} ${title}</span>
          <span style="font-size:12px;color:#aaa;font-weight:700;">(${drillsList.length} ejercicios)</span>
        </div>
        ${subSectionsHtml}
      </div>
    `;
  };

  let html = '';
  if (currentLevelFilter === 'all' || currentLevelFilter === 'formativo') {
    html += renderSection('FÚTBOL FORMATIVO / INICIACIÓN (SEMILLEROS)', '👦', formativos, '#50e3c2');
  }
  if (currentLevelFilter === 'all' || currentLevelFilter === 'competitivo') {
    html += renderSection('FÚTBOL COMPETITIVO / SENIOR', '🏆', competitivos, 'var(--oro)');
  }

  container.innerHTML = html;
}

// ══════════════════════════════════════════════════════════════════════════
// RENDERIZADO DEL MODAL CON PESTAÑAS HORIZONTALES DE 100% ANCHO
// ══════════════════════════════════════════════════════════════════════════
export function abrirModalBibliotecaCompleta() {
  const modal = document.getElementById('modal-biblioteca-completa');
  if (!modal) return;

  modal.style.display = 'flex';
  bindModalTabsEvents();
  renderBibliotecaModal();
}

function bindModalTabsEvents() {
  document.querySelectorAll('.btn-modal-section-tab').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.btn-modal-section-tab').forEach(b => {
        b.style.background = '#1a1a1a';
        b.style.color = '#eee';
        b.style.border = '1px solid #333';
        b.classList.remove('active');
      });
      btn.style.background = 'var(--oro)';
      btn.style.color = '#000';
      btn.style.border = 'none';
      btn.classList.add('active');

      modalLevelFilter = btn.dataset.level;
      renderBibliotecaModal();
    };
  });

  document.querySelectorAll('#modal-subcat-tabs-bar .subtab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#modal-subcat-tabs-bar .subtab-btn').forEach(b => {
        b.style.background = '#181818';
        b.style.color = '#ccc';
        b.style.border = '1px solid #333';
        b.classList.remove('active');
      });
      btn.style.background = '#50e3c2';
      btn.style.color = '#000';
      btn.style.border = 'none';
      btn.classList.add('active');

      modalCatFilter = btn.dataset.cat;
      renderBibliotecaModal();
    };
  });
}

export function renderBibliotecaModal() {
  const container = document.getElementById('modal-drills-container');
  if (!container) return;

  const catObj = getEntrenamientosData();
  const allDrills = [...EJERCICIOS_DB, ...(catObj.customDrills || [])];

  const filtered = allDrills.filter(d => {
    const matchLevel = (modalLevelFilter === 'all') || (d.level === modalLevelFilter);
    const matchCat = (modalCatFilter === 'all') || (d.cat === modalCatFilter);
    return matchLevel && matchCat;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:50px;color:#777;font-size:14px;">No hay ejercicios que coincidan en esta categoría.</div>`;
    return;
  }

  const subcats = ['ludico', 'pre_entreno', 'pre_partido', 'tactica', 'tecnica', 'abp', 'fisico'];

  const html = subcats.map(subKey => {
    const items = filtered.filter(d => d.cat === subKey);
    if (items.length === 0) return '';

    const catInfo = CAT_MAP[subKey] || { name: subKey, color: '#fff' };
    const cardsHtml = items.map(d => buildDrillCardHTML(d, catInfo.color)).join('');

    return `
      <div style="margin-bottom:24px;">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:900;color:${catInfo.color};margin-bottom:12px;display:flex;align-items:center;gap:6px;border-bottom:1px solid #282828;padding-bottom:6px;">
          <span>${catInfo.name}</span>
          <span style="font-size:12px;color:#777;">(${items.length} ejercicios)</span>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:16px;">
          ${cardsHtml}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

// ══════════════════════════════════════════════════════════════════════════
// DETALLE DE EJERCICIO EN MODAL (EXPLICACIÓN MINUCIOSA + MATERIALES)
// ══════════════════════════════════════════════════════════════════════════
export function verDetalleEjercicio(id) {
  const catObj = getEntrenamientosData();
  const allDrills = [...EJERCICIOS_DB, ...(catObj.customDrills || [])];
  const d = allDrills.find(x => x.id === id);
  if (!d) return;

  const modal = document.getElementById('modal-drill-detail');
  if (!modal) return;

  const titleEl = document.getElementById('drill-detail-title');
  const imgEl = document.getElementById('drill-detail-img');
  const durEl = document.getElementById('drill-detail-dur');
  const descEl = document.getElementById('drill-detail-desc');
  const rulesEl = document.getElementById('drill-detail-rules');
  const materialsEl = document.getElementById('drill-detail-materials');
  const levelBadge = document.getElementById('drill-detail-level-badge');

  if (titleEl) titleEl.textContent = d.title;
  if (imgEl) imgEl.src = d.img;
  if (durEl) durEl.textContent = d.dur;
  if (levelBadge) levelBadge.textContent = d.level === 'formativo' ? '👦 FÚTBOL FORMATIVO' : '🏆 FÚTBOL COMPETITIVO';
  if (descEl) descEl.textContent = d.desc;
  if (rulesEl) rulesEl.textContent = d.rules || 'Sin consignas específicas.';
  if (materialsEl) materialsEl.textContent = getDrillMaterials(d);

  // Limpiar contenedor de animaciones antiguo si existía
  const animBox = document.getElementById('drill-detail-anim-box');
  if (animBox) animBox.style.display = 'none';

  modal.style.display = 'flex';
}

window._verDetalleEjercicio = (id) => verDetalleEjercicio(id);

// ══════════════════════════════════════════════════════════════════════════
// PLANNER SEMANAL DE SESIONES
// ══════════════════════════════════════════════════════════════════════════
let draftSessionDrills = [];

export function renderPlannerUI() {
  const container = document.getElementById('planner-sessions-list');
  if (!container) return;

  const catObj = getEntrenamientosData();
  const sesiones = catObj.sesiones || [];

  if (sesiones.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:30px;color:#666;font-size:13px;">No hay sesiones planificadas para ${perfil.categoriaActiva}. Presiona "+ Nueva Sesión" para comenzar.</div>`;
    return;
  }

  const allDrills = [...EJERCICIOS_DB, ...(catObj.customDrills || [])];

  container.innerHTML = sesiones.map((s, index) => {
    const drillsList = (s.drills || []).map(did => {
      const drill = allDrills.find(x => x.id === did);
      return drill ? `<div style="font-size:12px;background:#1a1a1a;border:1px solid #282828;padding:6px 10px;border-radius:6px;color:#ccc;display:flex;justify-content:space-between;"><span>⚽ ${drill.title}</span> <span style="color:var(--verde-campo);font-weight:700;">${drill.dur}</span></div>` : '';
    }).join('');

    return `
      <div style="background:#111;border:1px solid #222;border-radius:10px;padding:14px;margin-bottom:12px;display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #222;padding-bottom:8px;">
          <div>
            <span style="background:var(--verde-campo);color:#000;font-weight:900;font-size:11px;padding:2px 8px;border-radius:4px;text-transform:uppercase;">${s.dia || 'Entrenamiento'}</span>
            <h4 style="font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:800;color:#fff;margin:4px 0 0 0;">${s.titulo || 'Sesión de Entrenamiento'}</h4>
          </div>
          <button onclick="window._eliminarSesion(${index})" style="background:none;border:none;color:#ff5252;cursor:pointer;font-size:14px;">🗑️</button>
        </div>
        <div style="font-size:12px;color:#aaa;">⏱️ Duración Total: <strong style="color:#fff;">${s.duracionTotal || '60 min'}</strong> | 🎯 Enfoque: <strong style="color:var(--oro);">${s.enfoque || 'Táctico/Técnico'}</strong></div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-top:4px;">
          ${drillsList || '<div style="font-size:11px;color:#666;">Sin ejercicios asignados.</div>'}
        </div>
      </div>
    `;
  }).join('');
}

export function agregarEjercicioASesion(drillId) {
  const catObj = getEntrenamientosData();
  const allDrills = [...EJERCICIOS_DB, ...(catObj.customDrills || [])];
  const d = allDrills.find(x => x.id === drillId);
  if (!d) return;

  draftSessionDrills.push(drillId);
  mostrarNotificacionApp('Ejercicio Añadido', `"${d.title}" agregado a la sesión borrador.`);
  actualizarDraftSessionUI();
}

window._agregarEjercicioASesion = (id) => agregarEjercicioASesion(id);

function actualizarDraftSessionUI() {
  const container = document.getElementById('draft-session-drills-list');
  if (!container) return;

  const catObj = getEntrenamientosData();
  const allDrills = [...EJERCICIOS_DB, ...(catObj.customDrills || [])];

  if (draftSessionDrills.length === 0) {
    container.innerHTML = `<div style="font-size:11px;color:#666;text-align:center;padding:10px;">Selecciona ejercicios de la biblioteca para armar tu práctica.</div>`;
    return;
  }

  container.innerHTML = draftSessionDrills.map((did, i) => {
    const drill = allDrills.find(x => x.id === did);
    return drill ? `
      <div style="font-size:12px;background:#1a1a1a;border:1px solid #333;padding:6px 10px;border-radius:6px;color:#eee;display:flex;justify-content:space-between;align-items:center;">
        <span>⚽ ${drill.title} (${drill.dur})</span>
        <button onclick="window._removerDraftDrill(${i})" style="background:none;border:none;color:#ff5252;cursor:pointer;font-size:12px;">✖</button>
      </div>
    ` : '';
  }).join('');
}

window._removerDraftDrill = (index) => {
  draftSessionDrills.splice(index, 1);
  actualizarDraftSessionUI();
};

export async function guardarNuevaSesion() {
  const inputDia = document.getElementById('session-dia-input');
  const inputTitulo = document.getElementById('session-titulo-input');
  const inputEnfoque = document.getElementById('session-enfoque-input');

  const dia = inputDia ? inputDia.value : 'Lunes';
  const titulo = inputTitulo ? inputTitulo.value.trim() : 'Sesión de Entrenamiento';
  const enfoque = inputEnfoque ? inputEnfoque.value.trim() : 'Táctico y Físico';

  if (draftSessionDrills.length === 0) {
    return mostrarNotificacionApp('Sesión vacía', 'Añade al menos 1 ejercicio a la sesión.', false);
  }

  const catObj = getEntrenamientosData();
  catObj.sesiones.push({
    dia,
    titulo,
    enfoque,
    duracionTotal: `${draftSessionDrills.length * 15} min`,
    drills: [...draftSessionDrills],
    createdAt: new Date().toISOString()
  });

  draftSessionDrills = [];
  if (inputTitulo) inputTitulo.value = '';
  actualizarDraftSessionUI();
  renderPlannerUI();

  autoSaveLocal();
  await guardarFirebase();
  mostrarNotificacionApp('Sesión Guardada', `Sesión "${titulo}" guardada para ${dia}.`);
}

export async function eliminarSesion(index) {
  const catObj = getEntrenamientosData();
  if (catObj.sesiones && catObj.sesiones[index]) {
    catObj.sesiones.splice(index, 1);
    renderPlannerUI();
    autoSaveLocal();
    await guardarFirebase();
    mostrarNotificacionApp('Sesión Eliminada', 'La sesión fue eliminada.');
  }
}

window._eliminarSesion = (i) => eliminarSesion(i);

// ══════════════════════════════════════════════════════════════════════════
// CONTROL DE ASISTENCIA 1 POR 1 (PASAR LISTA WIZARD) Y VER LISTADO COMPLETO
// ══════════════════════════════════════════════════════════════════════════
let pasarListaJugadores = [];
let pasarListaIndex = 0;
let listadoCompletoVisible = false;

export function iniciarPasarListaWizard() {
  const catObj = getEntrenamientosData();
  const activePlantel = catObj.plantel || plantel || {};
  pasarListaJugadores = [];

  ['por', 'def', 'med', 'del'].forEach(rol => {
    if (activePlantel[rol] && Array.isArray(activePlantel[rol])) {
      activePlantel[rol].forEach(j => {
        const nombre = typeof j === 'object' ? j.nombre : j;
        const rolTexto = rol === 'por' ? '🧤 Portero' : rol === 'def' ? '🛡️ Defensa' : rol === 'med' ? '🎯 Mediocampista' : '⚡ Delantero';
        if (nombre && !pasarListaJugadores.some(x => x.nombre === nombre)) {
          pasarListaJugadores.push({ nombre, rol: rolTexto });
        }
      });
    }
  });

  if (pasarListaJugadores.length === 0) {
    return mostrarNotificacionApp('Sin Jugadores', `No hay jugadores registrados en ${perfil.categoriaActiva}. Inscríbelos en PLANTEL.`, false);
  }

  pasarListaIndex = 0;
  const modal = document.getElementById('modal-pasar-lista-wizard');
  if (modal) modal.style.display = 'flex';
  renderPasarListaStep();
}

export function renderPasarListaStep() {
  if (pasarListaIndex >= pasarListaJugadores.length) {
    const modal = document.getElementById('modal-pasar-lista-wizard');
    if (modal) modal.style.display = 'none';
    mostrarNotificacionApp('¡Lista Completada!', `🎉 Se tomó asistencia a los ${pasarListaJugadores.length} jugadores de ${perfil.categoriaActiva}.`);
    renderAsistenciaUI();
    return;
  }

  const jugador = pasarListaJugadores[pasarListaIndex];
  const stepCounter = document.getElementById('pasar-lista-step-counter');
  const playerName = document.getElementById('pasar-lista-player-name');
  const playerRole = document.getElementById('pasar-lista-player-role');

  if (stepCounter) stepCounter.textContent = `JUGADOR ${pasarListaIndex + 1} DE ${pasarListaJugadores.length}`;
  if (playerName) playerName.textContent = `⚽ ${jugador.nombre}`;
  if (playerRole) playerRole.textContent = `${jugador.rol} | Equipo: ${perfil.categoriaActiva}`;
}

export async function marcarAsistenciaIndividual(estado) {
  if (pasarListaIndex >= pasarListaJugadores.length) return;

  const jugador = pasarListaJugadores[pasarListaIndex];
  const catObj = getEntrenamientosData();
  const hoyFecha = new Date().toISOString().split('T')[0];
  if (!catObj.asistencia[hoyFecha]) catObj.asistencia[hoyFecha] = {};

  catObj.asistencia[hoyFecha][jugador.nombre] = estado;

  if (estado === 'lesionado') {
    abrirModalLesion(jugador.nombre);
  }

  pasarListaIndex++;
  renderPasarListaStep();

  autoSaveLocal();
  await guardarFirebase();
}

window._iniciarPasarListaWizard = iniciarPasarListaWizard;
window._marcarAsistenciaIndividual = (e) => marcarAsistenciaIndividual(e);

export function toggleListadoCompleto() {
  listadoCompletoVisible = !listadoCompletoVisible;
  const container = document.getElementById('attendance-players-list');
  const btn = document.getElementById('btn-toggle-listado-completo');

  if (container) {
    container.style.display = listadoCompletoVisible ? 'block' : 'none';
  }
  if (btn) {
    btn.textContent = listadoCompletoVisible ? '📊 OCULTAR LISTADO COMPLETO' : '📊 VER LISTADO COMPLETO Y PORCENTAJES';
  }
  if (listadoCompletoVisible) {
    renderAsistenciaUI();
  }
}

window._toggleListadoCompleto = toggleListadoCompleto;

export function renderAsistenciaUI() {
  const container = document.getElementById('attendance-players-list');
  const dateBadge = document.getElementById('attendance-today-date');
  if (!container) return;

  const catObj = getEntrenamientosData();
  const asistenciaData = catObj.asistencia || {};
  const lesionesData = catObj.lesiones || {};

  const hoyFecha = new Date().toISOString().split('T')[0];
  if (dateBadge) dateBadge.textContent = `📅 ${hoyFecha}`;

  const activePlantel = catObj.plantel || plantel || {};
  let listaJugadores = [];

  ['por', 'def', 'med', 'del'].forEach(rol => {
    if (activePlantel[rol] && Array.isArray(activePlantel[rol])) {
      activePlantel[rol].forEach(j => {
        const nombre = typeof j === 'object' ? j.nombre : j;
        if (nombre && !listaJugadores.includes(nombre)) {
          listaJugadores.push(nombre);
        }
      });
    }
  });

  if (listaJugadores.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:20px;color:#666;font-size:12px;">No hay jugadores registrados en el plantel de ${perfil.categoriaActiva}. Ve a la pestaña PLANTEL para inscribir tus jugadores.</div>`;
    return;
  }

  const registroHoy = asistenciaData[hoyFecha] || {};

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${listaJugadores.map(nombre => {
        const estado = registroHoy[nombre] || (lesionesData[nombre] ? 'lesionado' : 'presente');

        let totalFechas = 0;
        let asistencias = 0;
        let inasistencias = 0;
        let justificadas = 0;

        Object.keys(asistenciaData).forEach(f => {
          if (asistenciaData[f][nombre]) {
            totalFechas++;
            if (asistenciaData[f][nombre] === 'presente') asistencias++;
            if (asistenciaData[f][nombre] === 'ausente') inasistencias++;
            if (asistenciaData[f][nombre] === 'justificada') justificadas++;
          }
        });
        const pct = totalFechas > 0 ? Math.round((asistencias / totalFechas) * 100) : 100;

        return `
          <div style="background:#111;border:1px solid #222;border-radius:8px;padding:10px 12px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
            <div>
              <div style="font-size:13px;font-weight:800;color:#fff;">⚽ ${nombre}</div>
              <div style="font-size:10px;color:#aaa;margin-top:2px;">
                🟢 Asistencias: <strong style="color:#50e3c2;">${asistencias}</strong> | 
                🔴 Faltas: <strong style="color:#ff5252;">${inasistencias}</strong> | 
                🟡 Justificadas: <strong style="color:var(--oro);">${justificadas}</strong> | 
                % Asistencia: <strong style="color:${pct >= 80 ? '#50e3c2' : pct >= 60 ? 'var(--oro)' : '#ff5252'};">${pct}%</strong>
              </div>
            </div>
            <div style="display:flex;gap:4px;">
              <button onclick="window._setAsistenciaEstado('${nombre}', 'presente')" style="background:${estado === 'presente' ? '#4caf50' : '#1e1e1e'};color:${estado === 'presente' ? '#000' : '#888'};border:1px solid #333;padding:4px 6px;border-radius:4px;font-size:9px;font-weight:800;cursor:pointer;">🟢 Pres.</button>
              <button onclick="window._setAsistenciaEstado('${nombre}', 'justificada')" style="background:${estado === 'justificada' ? 'var(--oro)' : '#1e1e1e'};color:${estado === 'justificada' ? '#000' : '#888'};border:1px solid #333;padding:4px 6px;border-radius:4px;font-size:9px;font-weight:800;cursor:pointer;">🟡 Just.</button>
              <button onclick="window._setAsistenciaEstado('${nombre}', 'ausente')" style="background:${estado === 'ausente' ? '#ff5252' : '#1e1e1e'};color:${estado === 'ausente' ? '#fff' : '#888'};border:1px solid #333;padding:4px 6px;border-radius:4px;font-size:9px;font-weight:800;cursor:pointer;">🔴 Aus.</button>
              <button onclick="window._setAsistenciaEstado('${nombre}', 'lesionado')" style="background:${estado === 'lesionado' ? '#9c27b0' : '#1e1e1e'};color:${estado === 'lesionado' ? '#fff' : '#888'};border:1px solid #333;padding:4px 6px;border-radius:4px;font-size:9px;font-weight:800;cursor:pointer;">🏥 Les.</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

export async function setAsistenciaEstado(nombre, estado) {
  const catObj = getEntrenamientosData();
  const hoyFecha = new Date().toISOString().split('T')[0];
  if (!catObj.asistencia[hoyFecha]) catObj.asistencia[hoyFecha] = {};

  catObj.asistencia[hoyFecha][nombre] = estado;

  if (estado === 'lesionado') {
    abrirModalLesion(nombre);
  }

  renderAsistenciaUI();
  renderLesionesUI();
  autoSaveLocal();
  await guardarFirebase();
}

window._setAsistenciaEstado = (n, e) => setAsistenciaEstado(n, e);

// ══════════════════════════════════════════════════════════════════════════
// DEPARTAMENTO MÉDICO & INFORME DE LESIONES
// ══════════════════════════════════════════════════════════════════════════
let targetJugadorLesion = '';

export function abrirModalLesion(nombreJugador) {
  targetJugadorLesion = nombreJugador;
  const modal = document.getElementById('modal-injury-report');
  if (!modal) return;

  document.getElementById('injury-player-name').textContent = nombreJugador;
  modal.style.display = 'flex';
}

export async function guardarParteMedico() {
  if (!targetJugadorLesion) return;

  const inputTipo = document.getElementById('injury-type-input');
  const inputTiempo = document.getElementById('injury-time-input');
  const inputNotas = document.getElementById('injury-notes-input');

  const tipo = inputTipo ? inputTipo.value.trim() : 'Sobrecarga Muscular';
  const tiempo = inputTiempo ? inputTiempo.value.trim() : '7 días';
  const notas = inputNotas ? inputNotas.value.trim() : '';

  const catObj = getEntrenamientosData();
  catObj.lesiones[targetJugadorLesion] = {
    tipo,
    tiempo,
    notas,
    fechaInicio: new Date().toISOString().split('T')[0]
  };

  const modal = document.getElementById('modal-injury-report');
  if (modal) modal.style.display = 'none';

  renderLesionesUI();
  renderAsistenciaUI();
  autoSaveLocal();
  await guardarFirebase();
  mostrarNotificacionApp('Parte Médico Guardado', `Lesión de ${targetJugadorLesion} registrada (${tipo}).`);
}

export function renderLesionesUI() {
  const container = document.getElementById('medical-injuries-list');
  if (!container) return;

  const catObj = getEntrenamientosData();
  const lesiones = catObj.lesiones || {};
  const nombres = Object.keys(lesiones);

  if (nombres.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:25px;color:#50e3c2;font-size:13px;font-weight:700;">🟢 ¡Excelente! No hay jugadores lesionados en ${perfil.categoriaActiva}.</div>`;
    return;
  }

  container.innerHTML = nombres.map(nombre => {
    const info = lesiones[nombre];
    return `
      <div style="background:#160d1b;border:1px solid #9c27b0;border-radius:10px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:14px;font-weight:800;color:#e1bee7;">🏥 ${nombre}</div>
          <div style="font-size:12px;color:#ba68c8;margin-top:2px;">Lesión: <strong>${info.tipo}</strong> | Tiempo Estimado: <strong>${info.tiempo}</strong></div>
          ${info.notas ? `<div style="font-size:11px;color:#aaa;margin-top:4px;">📝 ${info.notas}</div>` : ''}
        </div>
        <button onclick="window._darAltaMedica('${nombre}')" style="background:#4caf50;border:none;color:#000;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;">🟢 Alta Médica</button>
      </div>
    `;
  }).join('');
}

export async function darAltaMedica(nombre) {
  const catObj = getEntrenamientosData();
  if (catObj.lesiones && catObj.lesiones[nombre]) {
    delete catObj.lesiones[nombre];
    renderLesionesUI();
    renderAsistenciaUI();
    autoSaveLocal();
    await guardarFirebase();
    mostrarNotificacionApp('Alta Médica', `${nombre} ha recibido el Alta Médica y está disponible.`);
  }
}

window._darAltaMedica = (n) => darAltaMedica(n);

// ══════════════════════════════════════════════════════════════════════════
// INICIALIZACIÓN DE EVENT LISTENERS DE LA SECCIÓN DE ENTRENAMIENTOS
// ══════════════════════════════════════════════════════════════════════════
export function initEntrenamientosUI() {
  // Listener de filtro de Nivel en vista principal
  const levelSelect = document.getElementById('filter-drill-level');
  if (levelSelect) {
    levelSelect.onchange = (e) => {
      currentLevelFilter = e.target.value;
      renderBibliotecaEjercicios();
    };
  }

  // Listener de filtro de Categoría Técnica en vista principal
  const catSelect = document.getElementById('filter-drill-cat');
  if (catSelect) {
    catSelect.onchange = (e) => {
      currentCatFilter = e.target.value;
      renderBibliotecaEjercicios();
    };
  }

  // Listener de abrir modal biblioteca completa
  const btnAbrirModalBiblio = document.getElementById('btn-abrir-modal-biblioteca');
  if (btnAbrirModalBiblio) {
    btnAbrirModalBiblio.onclick = abrirModalBibliotecaCompleta;
  }

  // Listener para Guardar Sesión
  const btnSaveSession = document.getElementById('btn-save-session');
  if (btnSaveSession) {
    btnSaveSession.onclick = guardarNuevaSesion;
  }

  // Listener para Guardar Parte Médico
  const btnSaveMedical = document.getElementById('btn-save-medical-report');
  if (btnSaveMedical) {
    btnSaveMedical.onclick = guardarParteMedico;
  }

  // Listener para Iniciar Pasar Lista Wizard (1 por 1)
  const btnInciarLista = document.getElementById('btn-iniciar-pasar-lista');
  if (btnInciarLista) {
    btnInciarLista.onclick = iniciarPasarListaWizard;
  }

  // Listener para Toggle Listado Completo
  const btnToggleListado = document.getElementById('btn-toggle-listado-completo');
  if (btnToggleListado) {
    btnToggleListado.onclick = toggleListadoCompleto;
  }

  // Renderizar vistas iniciales
  renderBibliotecaEjercicios();
  renderPlannerUI();
  renderAsistenciaUI();
  renderLesionesUI();
}
