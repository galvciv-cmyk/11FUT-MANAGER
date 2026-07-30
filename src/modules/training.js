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
    desc: 'Carrera de relevos por equipos de 3. Los jugadores deben correr con petos y colocarlos en una cuadrícula de conos de 3x3 para formar 3 en raya antes que el equipo rival.',
    rules: '1. Sale un jugador por turno. 2. Si hay 3 petos colocados, el siguiente debe mover uno de su color.',
    img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'lud_f2',
    title: 'El Zorro y los Cazadores de Balón',
    level: 'formativo',
    cat: 'ludico',
    dur: '10 min',
    desc: 'Un jugador (Zorro) conduce el balón dentro del área tratando de tocar a los demás con la mano mientras los demás intentan quitarle la pelota.',
    rules: '1. El zorro no puede perder el control de su balón. 2. Quien pierda la pelota pasa a ser zorro.',
    img: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'lud_f3',
    title: 'Robo de Colas con Conducción',
    level: 'formativo',
    cat: 'ludico',
    dur: '15 min',
    desc: 'Cada niño conduce su balón llevando una cinta/peto colgado en la parte trasera del pantalón. Deben quitar la cinta a los rivales sin descuidar su propio balón.',
    rules: '1. Quien pierda el balón sale temporalmente a hacer 5 dominadas. 2. Gana quien junte más cintas.',
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'lud_f4',
    title: 'Fútbol-Tenis Adaptado Infantil',
    level: 'formativo',
    cat: 'ludico',
    dur: '15 min',
    desc: 'Parejas jugando sobre una red baja o conos. Permite un pique en el suelo por cada toque de balón.',
    rules: '1. Máximo 3 toques por equipo. 2. Obligatorio usar ambas piernas.',
    img: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'lud_f5',
    title: 'Derribar el Cono del Castillo',
    level: 'formativo',
    cat: 'ludico',
    dur: '12 min',
    desc: 'Dos equipos frente a frente separados por 15 metros. En el centro hay 5 conos altos. Deben dar pases raseados intentando derribar los conos rivales.',
    rules: '1. No se puede invadir el área del centro. 2. Un punto por cada cono derribado.',
    img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'lud_c1',
    title: 'Rondo Recreativo 7v2 a Un Toque',
    level: 'competitivo',
    cat: 'ludico',
    dur: '12 min',
    desc: 'Rondo de integración a máxima velocidad con castigo recreativo (flexiones/túnel) para quienes pierdan el balón tras 20 pases seguidos.',
    rules: '1. Máximo 1 toque obligatorio. 2. Si hay caño (túnel), se suma 1 ronda extra adentro.',
    img: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'lud_c2',
    title: 'Fútbol Vóley de Competición 3v3',
    level: 'competitivo',
    cat: 'ludico',
    dur: '15 min',
    desc: 'Partido en cancha reducida a 2.5m de altura de red. Se aplica en sesiones de recuperación post-partido.',
    rules: '1. Sin piques en el suelo. 2. Remate de cabeza o volea únicamente.',
    img: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'lud_c3',
    title: 'Desafío del Travesaño en Grupo',
    level: 'competitivo',
    cat: 'ludico',
    dur: '10 min',
    desc: 'Competición de precisión a 20 metros de la portería para pegarle al travesaño con diferentes zonas del pie.',
    rules: '1. Cada acierto otorga 2 puntos. 2. El equipo perdedor recoge los materiales.',
    img: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'lud_c4',
    title: 'Pádel-Fútbol de Parejas',
    level: 'competitivo',
    cat: 'ludico',
    dur: '15 min',
    desc: 'Juego de reacción rápida usando paredes o vallas para hacer rebotar la pelota con control de pecho y muslo.',
    rules: '1. Máximo 2 toques por jugador. 2. Gol directo tras rebote vale doble.',
    img: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'lud_c5',
    title: 'Relevos Combinados de Habilidad',
    level: 'competitivo',
    cat: 'ludico',
    dur: '12 min',
    desc: 'Carreras de obstáculos: dominadas en movimiento + eslalon + pase a mini-portería de 30 metros.',
    rules: '1. Si la pelota toca el suelo en dominadas, se reinicia la estación. 2. Gana el equipo con menor tiempo.',
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
    desc: 'Los niños trotan suavemente en diferentes direcciones. A la señal sonora o de color (cono azul=salto, verde=skipping, rojo=freno seco), realizan el estímulo.',
    rules: '1. Reacción rápida sin chocar. 2. Cambios de dirección constantes.',
    img: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_e_f2',
    title: 'Escalera de Coordinación + Conducción Rápida',
    level: 'formativo',
    cat: 'pre_entreno',
    dur: '12 min',
    desc: 'Pasadas de frecuencia de apoyos en escalera (1 dentro 1 fuera, lateral) + pase corto al compañero que espera en el cono.',
    rules: '1. Coordinación visual antes que velocidad. 2. Apoyo sobre metatarsos.',
    img: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_e_f3',
    title: 'Movilidad Articular Dinámica en Círculo',
    level: 'formativo',
    cat: 'pre_entreno',
    dur: '8 min',
    desc: 'Círculo de equipo ejecutando aductores hacia adentro/afuera, balanceo de piernas, y skipping progresivo.',
    rules: '1. Ejecución fluida sin rebotes abruptos. 2. Respiración rítmica.',
    img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_e_f4',
    title: 'Rondo 3v1 con Estímulo Visual de Colores',
    level: 'formativo',
    cat: 'pre_entreno',
    dur: '10 min',
    desc: 'Rondo suave en espacio de 8x8m donde el entrenador levanta un cono de color y el poseedor del balón debe gritar el color mientras pasa.',
    rules: '1. Estimulación de la visión periférica. 2. Pases rasos a 2 toques.',
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_e_f5',
    title: 'Esquiva de Conos y Salto de Vallas Bajas',
    level: 'formativo',
    cat: 'pre_entreno',
    dur: '10 min',
    desc: 'Circuito lúdico de agilidad con 4 vallas infantiles (15cm) + aceleración de 5 metros a buscar un balón rodando.',
    rules: '1. Caída suave sobre dos pies. 2. Aceleración con la vista arriba.',
    img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_e_c1',
    title: 'Activación con Bandas Elásticas y Pliometría',
    level: 'competitivo',
    cat: 'pre_entreno',
    dur: '12 min',
    desc: 'Trabajo de glúteo medio y estabilidad de rodilla con minibands + saltos unipodales en hexágono.',
    rules: '1. Enfoque en prevención de LCA e isquiotibiales. 2. 3 series de 6 repeticiones.',
    img: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_e_c2',
    title: 'Pases Dinámicos de Tensión Progresiva',
    level: 'competitivo',
    cat: 'pre_entreno',
    dur: '10 min',
    desc: 'Parejas a 10 metros intercambiando pases rasos aumentando la potencia de golpeo gradualmente mientras realizan desplazamientos laterales.',
    rules: '1. Control tenso de primera. 2. Mantener cadencia alta.',
    img: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_e_c3',
    title: 'Circuito de Agilidad con Cambio de Dirección (COD)',
    level: 'competitivo',
    cat: 'pre_entreno',
    dur: '12 min',
    desc: 'Recorrido en Z con conos a 45 grados enfocando desaceleración y frenado fuerte con pierna exterior.',
    rules: '1. Centro de gravedad bajo en giros. 2. Salida explosiva.',
    img: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_e_c4',
    title: 'Rondo Posicional 4v2 con Cambios de Ritmo',
    level: 'competitivo',
    cat: 'pre_entreno',
    dur: '10 min',
    desc: 'Espacio reducidísimo (6x6m). 4 jugadores por fuera a 1 toque con intensidades variables según silbato.',
    rules: '1. Al silbato largo, cambio de rondo al esprint 10m.',
    img: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_e_c5',
    title: 'Core Estabilidad + Pase Aéreo de Cabeza',
    level: 'competitivo',
    cat: 'pre_entreno',
    dur: '10 min',
    desc: 'Estaciones de plancha frontal/lateral activando zona media + devolución inmediata de aire con frente.',
    rules: '1. Mantener bloque lumbar firme. 2. Golpeo de cabeza con ojos abiertos.',
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
    desc: 'Rondo dinámico sin presión excesiva para activar confianza y soltura del grupo antes de salir a la cancha.',
    rules: '1. Aplaudir cada 5 pases. 2. Sonrisas y concentración.',
    img: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_p_f2',
    title: 'Aceleraciones de 5m con Salida al Silbato',
    level: 'formativo',
    cat: 'pre_partido',
    dur: '6 min',
    desc: 'Filas de 3 jugadores alineados. Al silbato arrancan 5 metros a máxima velocidad y frenan progresivo.',
    rules: '1. Salida con apoyo fuerte. 2. Mantener la alineación.',
    img: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_p_f3',
    title: 'Paredes y Tiros a Puerta de Animación',
    level: 'formativo',
    cat: 'pre_partido',
    dur: '10 min',
    desc: 'El entrenador hace de pared en la frontal del área, el niño le entrega el balón, recibe la devolución y remata raso.',
    rules: '1. Buscar el poste lejano. 2. El portero calienta blocajes bajos.',
    img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_p_f4',
    title: 'Circuito de Pases Cruzados en Octógono',
    level: 'formativo',
    cat: 'pre_partido',
    dur: '8 min',
    desc: 'Los titulares forman una figura octogonal y realizan pases cruzados a 2 toques activando la comunicación verbal ("¡Mía!", "¡Voy!").',
    rules: '1. Llamar al compañero por su nombre. 2. Balón firme al pie.',
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_p_f5',
    title: 'Juego de Reacción "Toca el Cono Rápido"',
    level: 'formativo',
    cat: 'pre_partido',
    dur: '6 min',
    desc: 'En parejas frente a frente a 1 metro. El DT nombra partes del cuerpo (cabeza, rodilla). Al decir "¡BALÓN!", gana quien agarre la pelota primero.',
    rules: '1. Máxima atención auditiva. 2. Risas y enfoque competitivo sano.',
    img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_p_c1',
    title: 'Calentamiento Específico Competitivo de Posesión 6v6',
    level: 'competitivo',
    cat: 'pre_partido',
    dur: '12 min',
    desc: 'Partido en espacio de 20x20m entre titulares y suplentes a 1-2 toques buscando intensidad real de partido.',
    rules: '1. Presión tras pérdida inmediata (5 segundos). 2. Intensidad 100%.',
    img: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_p_c2',
    title: 'Esprint Progresivo con Frenado y Aceleración Secundaria',
    level: 'competitivo',
    cat: 'pre_partido',
    dur: '6 min',
    desc: 'Pasadas de 10m al 80% + freno seco + esprint final de 5m al 100% simular disputas reales de partido.',
    rules: '1. 4 repeticiones por jugador con 45s de pausa activa.',
    img: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_p_c3',
    title: 'Ensayo de Basculación y Centro-Remate Progresivo',
    level: 'competitivo',
    cat: 'pre_partido',
    dur: '10 min',
    desc: 'La defensa de 4 titulares realiza basculaciones a lo ancho del campo mientras extremos y delanteros ensayan centros y remates en carrera.',
    rules: '1. Sincronizar el desmarque al segundo palo. 2. Comunicación del portero en balones aéreos.',
    img: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_p_c4',
    title: 'Rondo de Tensión 4v2 con Cambios de Orientación',
    level: 'competitivo',
    cat: 'pre_partido',
    dur: '8 min',
    desc: 'Rondo de alta intensidad. Al completar 6 pases, el jugador debe meter un cambio de frente largo de 25m a otra celda.',
    rules: '1. Balón tenso por el aire. 2. Control de pecho/muslo del receptor.',
    img: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'pre_p_c5',
    title: 'Activación de Porteros: Disparos de Reacción en Corto',
    level: 'competitivo',
    cat: 'pre_partido',
    dur: '10 min',
    desc: 'El preparador de porteros realiza remates a quemarropa desde 7 metros con rebotes previos en vallas o muñecos.',
    rules: '1. Agilidad de manos y postura baja. 2. Desvío hacia los laterales.',
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
    desc: '4v4 en un cuadrado de 20x20m con 4 pequeñas porterías de conos (portales). Se hace gol conduciendo o pasando a través de un portal.',
    rules: '1. Fomentar la búsqueda de espacios libres. 2. Cambios de frente hacia el portal desguarnecido.',
    img: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tac_f2',
    title: 'Conservación de Balón 3v3 + 2 Comodines por Banda',
    level: 'formativo',
    cat: 'tactica',
    dur: '15 min',
    desc: 'Mantener la posesión apoyándose en dos jugadores neutrales colocados en las líneas laterales que juegan siempre con el equipo poseedor.',
    rules: '1. Los comodines juegan a 1 toque. 2. Obligatorio pasar por banda antes de hacer gol.',
    img: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tac_f3',
    title: 'Ataque vs Defensa 3v2 en Cancha Reducida',
    level: 'formativo',
    cat: 'tactica',
    dur: '15 min',
    desc: '3 atacantes salen en velocidad contra 2 defensores. Si los defensores roban, deben cruzar la línea de mitad de campo conduciendo.',
    rules: '1. Finalizar la jugada en menos de 12 segundos. 2. Aprovechar la superioridad numérica.',
    img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tac_f4',
    title: 'Desmarque Básico: Ruptura y Apoyo',
    level: 'formativo',
    cat: 'tactica',
    dur: '15 min',
    desc: 'Parejas de atacantes contra 1 defensor. Un atacante se acerca a pedir el balón (apoyo) atrae la marca y el otro pica al espacio vacío (ruptura).',
    rules: '1. Comunicación gestual previa. 2. Pase al pie o al espacio según movimiento.',
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tac_f5',
    title: 'Batalla de Zonas 4v4 (Sin Amontonarse)',
    level: 'formativo',
    cat: 'tactica',
    dur: '15 min',
    desc: 'El campo se divide en 4 cuadrantes. En cada cuadrante debe haber mínimo un jugador de cada equipo para enseñar la ocupación racional del espacio.',
    rules: '1. No puede haber más de 2 compañeros en la misma zona. 2. Pases cruzados entre zonas.',
    img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tac_f6',
    title: 'Transición Rápida 2v1 Acompañado',
    level: 'formativo',
    cat: 'tactica',
    dur: '12 min',
    desc: 'Sale 1v1 hacia la portería. A los 3 segundos se incorpora un segundo atacante desde atrás obligando a tomar decisiones rápidas.',
    rules: '1. Decidir si tirar o dar pase al libre. 2. Reacción inmediata.',
    img: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tac_c1',
    title: 'Juego de Posición 4v4 + 3 Comodines (Estilo Guardiola)',
    level: 'competitivo',
    cat: 'tactica',
    dur: '20 min',
    desc: 'Cuadrado de 25x25m. 3 comodines (Pivote interior y 2 Extremos) para generar siempre ventaja numérica 7v4 en posesión.',
    rules: '1. Encontrar al tercer hombre libre. 2. Presión tras pérdida en menos de 4 segundos.',
    img: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tac_c2',
    title: 'Salida de Balón 4v3 bajo Presión Alta',
    level: 'competitivo',
    cat: 'tactica',
    dur: '20 min',
    desc: 'Línea defensiva (2 Centrales + 2 Laterales) con Portero saliendo jugando contra 3 delanteros que presionan intensos.',
    rules: '1. Atraer marca para filtrar a espalda de presionantes. 2. Si hay robo, tiro directo.',
    img: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tac_c3',
    title: 'Repliegue Defensivo en Bloque Medio-Bajo 4v4+2',
    level: 'competitivo',
    cat: 'tactica',
    dur: '20 min',
    desc: 'Línea de 4 defensas sincronizando basculación y achique cuando el rival intenta filtrar pases interlineales.',
    rules: '1. Distancia máxima entre defensas: 8 metros. 2. Salir a achicar solo cuando el rival mira el balón.',
    img: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tac_c4',
    title: 'Transición Ofensiva Rápida tras Robo (Contraataque)',
    level: 'competitivo',
    cat: 'tactica',
    dur: '18 min',
    desc: 'Robo en campo propio y salida vertical inmediata de 3 atacantes contra 2 defensores replegando a máxima velocidad.',
    rules: '1. Máximo 3 pases antes de rematar. 2. Límite de tiempo: 8 segundos.',
    img: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tac_c5',
    title: 'Ataque Organizado contra Bloque Bajo (Centro y Remate)',
    level: 'competitivo',
    cat: 'tactica',
    dur: '20 min',
    desc: 'Circulaciones de balón de lado a lado para desorganizar al rival cerrado y doblar por banda con lateral volante.',
    rules: '1. Buscar ventaja 2v1 en banda. 2. Cargar el área con 3 rematadores a diferentes alturas.',
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tac_c6',
    title: 'Presión Tras Pérdida Caza-Balón (Gegenpressing)',
    level: 'competitivo',
    cat: 'tactica',
    dur: '18 min',
    desc: 'Espacio reducido. Al perder el balón, los 3 jugadores más cercanos saltan a asfixiar al poseedor en 3 segundos.',
    rules: '1. Acortar ángulos de pase. 2. Si no se recupera en 5s, armar bloque de nuevo.',
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
    desc: 'Estaciones en triangulo. Jugador A pasa a B con borde interno, B realiza control orientado hacia su pierna hábil y perfila a C.',
    rules: '1. Atacar el balón antes de recibirlo. 2. Cambiar de perfil en cada vuelta.',
    img: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tec_f2',
    title: 'Eslalon de Conducción con Múltiples Superficies',
    level: 'formativo',
    cat: 'tecnica',
    dur: '12 min',
    desc: 'Recorrido entre 6 conos utilizando empeine exterior para esquivar y borde interno para recortar.',
    rules: '1. Mirada levantada entre cono y cono. 2. Usar ambas piernas obligatoriamente.',
    img: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tec_f3',
    title: 'Centros a media altura y Volea Rrasa Infantil',
    level: 'formativo',
    cat: 'tecnica',
    dur: '15 min',
    desc: 'Pase bombeado desde la esquina del área para que el compañero impacte de primera con empeine antes de tocar suelo.',
    rules: '1. Apuntar abajo hacia las esquinas. 2. Mantener tronco inclinado sobre el balón.',
    img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tec_f4',
    title: 'Duelo 1v1 con Amagos y Regates Clásicos',
    level: 'formativo',
    cat: 'tecnica',
    dur: '15 min',
    desc: 'Pasillo estrecho (8x15m). El atacante debe encarar al defensor realizando bicicleta, amago de cuerpo o cambio de ritmo.',
    rules: '1. Si supera al rival tiene 3 segundos para tirar. 2. El defensor gana punto si roba.',
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tec_f5',
    title: 'Cabezazo Técnico con Salto Unipodal',
    level: 'formativo',
    cat: 'tecnica',
    dur: '12 min',
    desc: 'El compañero lanza el balón suavemente con las manos. El rematador salta con un pie, impacta frontal con ojos abiertos.',
    rules: '1. Golpeo con la frente, nunca coronilla. 2. Dirigir al suelo picado.',
    img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tec_f6',
    title: 'Controles Aéreos con Muslo y Pecho',
    level: 'formativo',
    cat: 'tecnica',
    dur: '12 min',
    desc: 'Pases por alto en parejas. Amortiguar con muslo o pecho para dejar la pelota lista para el pase raso inmediato.',
    rules: '1. Absorber el impacto con el cuerpo suave. 2. Sin usar las manos.',
    img: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tec_c1',
    title: 'Circuito de Paredes en Corto y Definición Rápida',
    level: 'competitivo',
    cat: 'tecnica',
    dur: '15 min',
    desc: 'Secuencia de doble pared rápida al borde del área a 1 toque finalizando con disparo colocado de borde interno.',
    rules: '1. Máxima precisión y potencia en el pase. 2. Definición al segundo palo.',
    img: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tec_c2',
    title: 'Centro Tenso en Carrera + Remate de Cabeza Picado',
    level: 'competitivo',
    cat: 'tecnica',
    dur: '18 min',
    desc: 'El extremo pisa línea de fondo y lanza centro con rosca hacia afuera para el desmarque del 9 entre centrales.',
    rules: '1. Centro entre portero y defensa. 2. Remate potente picado al piso.',
    img: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tec_c3',
    title: 'Remates tras Giro y Desmarque en Espacio Reducido',
    level: 'competitivo',
    cat: 'tecnica',
    dur: '15 min',
    desc: 'El delantero recibe de espaldas al marco con marca pegada, realiza giro rápido hacia su pierna fuerte y dispara en 1.5 segundos.',
    rules: '1. Proteger el balón con el cuerpo antes de girar. 2. Sorprender con tiro rápido.',
    img: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tec_c4',
    title: 'Pases Largos de Precisión de 35 Metros',
    level: 'competitivo',
    cat: 'tecnica',
    dur: '15 min',
    desc: 'Parejas a 35 metros ensayando cambios de orientación por alto impactando con empeine total sin que el balón pique en exceso.',
    rules: '1. El receptor debe amortiguar en 1 toque. 2. Trayectoria limpia sin rosca descontrolada.',
    img: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tec_c5',
    title: 'Mano a Mano 1v1 contra el Portero con Presión Trasera',
    level: 'competitivo',
    cat: 'tecnica',
    dur: '15 min',
    desc: 'El delantero arranca con 2 metros de ventaja perseguido por un defensa central. Debe definir ante la salida del arquero.',
    rules: '1. Resolver en máximo 3 toques. 2. Decidir entre vaselina, regate o tiro bajo.',
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tec_c6',
    title: 'Volea Acrobática tras Rechace de Cabeza',
    level: 'competitivo',
    cat: 'tecnica',
    dur: '15 min',
    desc: 'El balón sale despejado desde el área chica hacia el frente del área. El mediocampista llega en carrera y remata de volea sin picar.',
    rules: '1. Coordinación ojo-pie impecable. 2. Mantener la mirada en el balón hasta el impacto.',
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
    desc: 'Enseñar la técnica correcta de saque de banda (ambas manos detrás de la cabeza, pies apoyados) buscando apoyo en corto y pared.',
    rules: '1. No levantar los pies del suelo. 2. Ofrecer siempre dos opciones de pase.',
    img: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'abp_f2',
    title: 'Córner Infantil en Corto con Dos Jugadores',
    level: 'formativo',
    cat: 'abp',
    dur: '12 min',
    desc: 'Cobrar el tiro de esquina mediante un pase en corto al compañero que viene a mostrarse para buscar centro raseado peligroso.',
    rules: '1. Engañar al rival simulando disparo directo. 2. Centro potente al área chica.',
    img: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'abp_f3',
    title: 'Falta Lateral Básica con Marca Zonal',
    level: 'formativo',
    cat: 'abp',
    dur: '12 min',
    desc: 'Enseñar a los defensores infantiles a colocarse en línea mirando el balón y atacarlo en lugar de quedarse estáticos.',
    rules: '1. Despejar hacia los laterales. 2. Comunicación del portero ("¡Mía!").',
    img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'abp_f4',
    title: 'Tiro Libre Infantil sobre Barrera Baja',
    level: 'formativo',
    cat: 'abp',
    dur: '10 min',
    desc: 'Práctica de tiro libre a 16 metros con una barrera de 2 muñecos/conos altos aprendiendo a superar la altura con rosca interior.',
    rules: '1. Colocar el pie de apoyo al lado del balón. 2. Acompañar el movimiento.',
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'abp_c1',
    title: 'Córner Táctico con Bloqueo y Cortina al Primer Palo',
    level: 'competitivo',
    cat: 'abp',
    dur: '15 min',
    desc: 'Movimiento ensayado donde dos atacantes hacen bloqueo al marcador central para liberar al rematador que entra como un rayo al primer palo.',
    rules: '1. Salida en abanico coordinada. 2. El cobrador busca la cabeza del libre.',
    img: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'abp_c2',
    title: 'Tiro Libre Frontal con Jugador Oculto tras Barrera',
    level: 'competitivo',
    cat: 'abp',
    dur: '15 min',
    desc: 'Estrategia donde un atacante se agacha en la barrera rival y se abre justo antes del impacto permitiendo filtrar el balón raso.',
    rules: '1. Sincronización milimétrica. 2. El rematador ejecuta pase/tiro bajo.',
    img: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'abp_c3',
    title: 'Saque de Banda Ofensivo Directo al Área Chica (Lanzador)',
    level: 'competitivo',
    cat: 'abp',
    dur: '12 min',
    desc: 'Saque de banda largo impulsado con fuerza hacia el punto penal para peinar hacia atrás buscando la llegada de la segunda línea.',
    rules: '1. Peinar con el occipital. 2. Los extremos atacan los rebotes.',
    img: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'abp_c4',
    title: 'Defensa de Córner Mixta (Zonal + Marcas Hombre)',
    level: 'competitivo',
    cat: 'abp',
    dur: '15 min',
    desc: '3 mejores cabeceadores defienden zona chica + 3 defensores marcan al hombre a los peligrosos rivales.',
    rules: '1. No perder de vista la marca asignada. 2. Salida rápida en bloque al despeje.',
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
    desc: 'Paso por aros (pata coja, dos pies), salto sobre mini-vallas y aceleración suave de 8 metros para disparar.',
    rules: '1. Coordinación visual y motriz. 2. Caída con rodillas semi-flectadas.',
    img: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'fis_f2',
    title: 'Carrera de Relevos con Conducción en Zig-Zag',
    level: 'formativo',
    cat: 'fisico',
    dur: '12 min',
    desc: 'Relevos por equipos sorteando estacas/conos a máxima velocidad llevando el balón pegado al pie.',
    rules: '1. Dar el pase al compañero de atrás antes de cruzar la meta. 2. Diversión y esfuerzo.',
    img: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'fis_f3',
    title: 'Juego de Agilidad "El Espejo"',
    level: 'formativo',
    cat: 'fisico',
    dur: '10 min',
    desc: 'En parejas frente a frente a 2m. El atacante hace movimientos laterales rápidos y el defensor debe imitar sus movimientos sin tocarlo.',
    rules: '1. Mantener posición defensiva flexionada. 2. Cambios de ritmo repentinos.',
    img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'fis_f4',
    title: 'Caza de Banderines con Reacción Rápida',
    level: 'formativo',
    cat: 'fisico',
    dur: '12 min',
    desc: 'Jugadores echados boca abajo en el suelo. Al silbato se levantan en explosión y corren 10m a tomar un banderín en el centro.',
    rules: '1. Salida rápida desde el suelo. 2. Trabajo de potencia de piernas.',
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'fis_c1',
    title: 'Circuito Intermitente Neuromuscular con Balón (RSA)',
    level: 'competitivo',
    cat: 'fisico',
    dur: '18 min',
    desc: 'Estaciones de alta intensidad: Esprint 15m + Freno + Pase tenso + Pliometría + Tiro a puerta en 12 segundos.',
    rules: '1. Pausa de recuperación 1:3. 2. Mantener la técnica bajo fatiga.',
    img: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'fis_c2',
    title: 'Resistencia Específica 1v1 Continuo con Transición',
    level: 'competitivo',
    cat: 'fisico',
    dur: '15 min',
    desc: 'Duelo 1v1 intensísimo durante 45 segundos seguidos. Apenas sale la pelota el DT mete otro balón inmediatamente.',
    rules: '1. Exigencia aeróbica-anaeróbica máxima. 2. Mantener intensidad defensiva.',
    img: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'fis_c3',
    title: 'Fuerza Explosiva: Arrastre de Trineo / Liga + Esprint',
    level: 'competitivo',
    cat: 'fisico',
    dur: '15 min',
    desc: 'Carrera de 5 metros con resistencia de liga elástica sujetada por compañero + liberación para esprintar 10m libres.',
    rules: '1. Postura de zancada potente. 2. Transferencia a la velocidad pura.',
    img: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'fis_c4',
    title: 'Frenado Excéntrico y Prevención de Isquiotibiales (Nordic Hamstring)',
    level: 'competitivo',
    cat: 'fisico',
    dur: '12 min',
    desc: 'Ejercicio nórdico de isquiotibiales de rodillas frenando la caída del tronco hacia adelante con asistencia de compañero.',
    rules: '1. Mantener cadera extendida. 2. 3 series de 5 repeticiones.',
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
// GENERADOR DE CANAL DE DEMOSTRACIÓN TÁCTICA ANIMADA EN VIVO (SVG + CSS 60FPS)
// ══════════════════════════════════════════════════════════════════════════
function buildTacticalAnimationSVG() {
  return `
    <div style="position:relative;width:100%;height:100px;background:#143d22;overflow:hidden;border-radius:6px;border:1px solid #285e3a;">
      <!-- LÍNEAS DE CANCHA DE FÚTBOL -->
      <svg style="position:absolute;top:0;left:0;width:100%;height:100%;" viewBox="0 0 200 100">
        <rect x="5" y="5" width="190" height="90" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
        <line x1="100" y1="5" x2="100" y2="95" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
        <circle cx="100" cy="50" r="18" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
        <rect x="5" y="25" width="30" height="50" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.2"/>
        <rect x="165" y="25" width="30" height="50" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.2"/>
        
        <!-- JUGADOR AZUL EN MOVIMIENTO -->
        <circle cx="45" cy="35" r="5" fill="#00e5ff">
          <animate attributeName="cx" values="45;75;45" dur="3s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="35;25;35" dur="3s" repeatCount="indefinite"/>
        </circle>
        
        <!-- JUGADOR ROJO EN MOVIMIENTO -->
        <circle cx="155" cy="65" r="5" fill="#ff5252">
          <animate attributeName="cy" values="65;35;65" dur="2.5s" repeatCount="indefinite"/>
        </circle>
        
        <!-- BALÓN DORADO INTERACTIVO PASSING LOOP -->
        <circle cx="45" cy="35" r="3.5" fill="#ffd700">
          <animate attributeName="cx" values="45;155;45" dur="2.5s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="35;65;35" dur="2.5s" repeatCount="indefinite"/>
        </circle>

        <!-- LÍNEA DE PASE DISCONTINUA -->
        <line x1="45" y1="35" x2="155" y2="65" stroke="rgba(255,215,0,0.5)" stroke-dasharray="3,3" stroke-width="1"/>
      </svg>

      <div style="position:absolute;bottom:4px;right:6px;font-size:9px;color:rgba(255,255,255,0.9);font-weight:800;background:rgba(0,0,0,0.7);padding:2px 6px;border-radius:4px;border:1px solid #333;">
        ⚡ TÁCTICA ANIMADA EN VIVO
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════════════════
// GENERADOR DE HTML DE TARJETAS DE EJERCICIO CON ILUSTRACIÓN Y TÁCTICA ANIMADA
// ══════════════════════════════════════════════════════════════════════════
function buildDrillCardHTML(d, accentColor) {
  const catInfo = CAT_MAP[d.cat] || { name: d.cat, color: '#fff' };
  
  return `
    <div style="background:#111;border:1px solid #222;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;transition:transform 0.2s, border-color 0.2s;" onmouseenter="this.style.borderColor='${accentColor}';this.style.transform='translateY(-3px)';" onmouseleave="this.style.borderColor='#222';this.style.transform='translateY(0)';">
      
      <!-- PORTADA CON IMAGEN DE ALTA CALIDAD Y BADGES -->
      <div style="height:110px;background:url('${d.img}') center/cover no-repeat;position:relative;border-bottom:1px solid #222;">
        <div style="position:absolute;top:6px;left:6px;background:rgba(0,0,0,0.85);color:#fff;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:800;border:1px solid ${catInfo.color};">
          ${d.level === 'formativo' ? '👦 FORMATIVO' : '🏆 COMPETITIVO'}
        </div>
        <div style="position:absolute;bottom:6px;right:6px;background:rgba(0,0,0,0.85);color:var(--oro);padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;">
          ⏱️ ${d.dur}
        </div>
      </div>
      
      <!-- REPRODUCTOR ANIMADO DE DEMOSTRACIÓN TÁCTICA 60FPS GARANTIZADO 100% VISIBLE -->
      <div style="padding:6px;background:#080808;border-bottom:1px solid #222;">
        ${buildTacticalAnimationSVG()}
      </div>

      <div style="padding:12px;display:flex;flex-direction:column;flex:1;justify-content:space-between;gap:8px;">
        <div>
          <h4 style="font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:800;color:#fff;margin:0 0 4px 0;">${d.title}</h4>
          <p style="font-size:11px;color:#aaa;line-height:1.35;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${d.desc}</p>
        </div>
        <div style="display:flex;gap:6px;margin-top:6px;">
          <button onclick="window._verDetalleEjercicio('${d.id}')" style="flex:1;background:#1a1a1a;border:1px solid #333;color:#eee;padding:6px 8px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">🔍 Ver Reglas & Táctica</button>
          <button onclick="window._agregarEjercicioASesion('${d.id}')" style="background:var(--verde-campo);border:none;color:#000;padding:6px 10px;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;">+ Añadir</button>
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
  // Bind botones de Nivel (Todos / Formativo / Competitivo)
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

  // Bind botones de Subcategorías Técnicas (Pills)
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

  // Agrupar por categoría técnica y mostrar en una grilla perfecta de 3 a 4 columnas
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

        <!-- GRILLA HORIZONAL COMPLETA DE 3 COLUMNAS QUE OCUPA EL 100% DEL ESPACIO -->
        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:16px;">
          ${cardsHtml}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

// ══════════════════════════════════════════════════════════════════════════
// DETALLE DE EJERCICIO EN MODAL
// ══════════════════════════════════════════════════════════════════════════
export function verDetalleEjercicio(id) {
  const catObj = getEntrenamientosData();
  const allDrills = [...EJERCICIOS_DB, ...(catObj.customDrills || [])];
  const d = allDrills.find(x => x.id === id);
  if (!d) return;

  const modal = document.getElementById('modal-drill-detail');
  if (!modal) return;

  document.getElementById('drill-detail-title').textContent = d.title;
  document.getElementById('drill-detail-img').src = d.img;
  document.getElementById('drill-detail-dur').textContent = d.dur;
  document.getElementById('drill-detail-desc').textContent = d.desc;
  document.getElementById('drill-detail-rules').textContent = d.rules || 'Sin consignas específicas.';

  let animBox = document.getElementById('drill-detail-anim-box');
  if (!animBox) {
    const animContainer = document.createElement('div');
    animContainer.id = 'drill-detail-anim-box';
    animContainer.style.marginTop = '12px';
    animContainer.innerHTML = `
      <div style="font-size:11px;color:var(--oro);font-weight:800;margin-bottom:4px;">🎥 DEMOSTRACIÓN TÁCTICA ANIMADA EN VIVO:</div>
      ${buildTacticalAnimationSVG()}
    `;
    const rulesBox = document.getElementById('drill-detail-rules')?.parentElement;
    if (rulesBox && rulesBox.parentElement) {
      rulesBox.parentElement.appendChild(animContainer);
    }
  }

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
