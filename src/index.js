import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { Tournament } from './tournament.js';
import { loadTournaments, saveTournaments, restoreTournaments } from './persistence.js';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Almacenar torneos activos por chat
let tournaments = new Map();
const userStates = new Map();

// Cargar torneos guardados al iniciar
async function initializeTournaments() {
  try {
    const data = await loadTournaments();
    tournaments = restoreTournaments(data);
    console.log(`✅ Cargados ${tournaments.size} torneos desde el almacenamiento`);
    console.log('📋 Chat IDs cargados:', Array.from(tournaments.keys()));
  } catch (error) {
    console.error('Error cargando torneos:', error);
  }
}

// Guardar torneos automáticamente
async function autoSave() {
  await saveTournaments(tournaments);
}

// Inicializar torneos
await initializeTournaments();

// Configurar comandos del bot
await bot.setMyCommands([
  { command: 'start', description: 'Ver información del bot' },
  { command: 'ayuda', description: 'Guía de uso del bot' },
  { command: 'chatid', description: 'Ver el ID de este chat' },
  { command: 'nuevo_torneo', description: 'Crear un nuevo torneo' },
  { command: 'clasificacion', description: 'Ver tabla de posiciones' },
  { command: 'todas_jornadas', description: 'Historial completo de partidos' },
  { command: 'ultima_jornada', description: 'Resultados de la última jornada' },
  { command: 'jornada_actual', description: 'Partidos pendientes actuales' },
  { command: 'proximas_jornadas', description: 'Calendario de próximos partidos' },
  { command: 'registrar_resultado', description: 'Registrar resultado de partido' }
]);

console.log('🤖 Bot de torneos de ajedrez iniciado...');

/**
 * Comando /start
 */
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const chatType = msg.chat.type;
  const chatTitle = msg.chat.title || 'tu chat';
  
  bot.sendMessage(chatId, 
    '♟️ Bienvenido al Bot de Torneos de Ajedrez\n\n' +
    `🆔 Chat ID: ${chatId}\n` +
    `📱 Tipo: ${chatType}\n\n` +
    'Comandos disponibles:\n' +
    '/chatid - Ver el ID de este chat\n' +
    '/nuevo_torneo - Crear un nuevo torneo\n' +
    '/clasificacion - Ver la clasificación actual\n' +
    '/todas_jornadas - Ver todas las jornadas\n' +
    '/ultima_jornada - Ver la última jornada completada\n' +
    '/jornada_actual - Ver la jornada actual\n' +
    '/proximas_jornadas - Ver las próximas jornadas\n' +
    '/registrar_resultado - Registrar el resultado de un partido\n' +
    '/ayuda - Mostrar esta ayuda'
  );
});

/**
 * Comando /ayuda
 */
bot.onText(/\/ayuda/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
    '📖 Guía de uso del bot\n\n' +
    '1. Crear torneo:\n' +
    '/nuevo_torneo - Te pedirá los nombres de los participantes (separados por comas)\n\n' +
    '2. Ver información:\n' +
    '/clasificacion - Tabla de posiciones con puntos y estadísticas\n' +
    '/todas_jornadas - Historial completo de partidos\n' +
    '/ultima_jornada - Resultados de la última jornada\n' +
    '/jornada_actual - Partidos pendientes de la jornada actual\n' +
    '/proximas_jornadas - Calendario de próximos partidos\n\n' +
    '3. Registrar resultados:\n' +
    '/registrar_resultado - Introduce ID del partido y resultado\n' +
    '   Ejemplo: 5 1-0 (partido 5, gana blancas)\n' +
    '   Resultados: 1-0 (gana jugador 1), 0-1 (gana jugador 2), 0.5-0.5 (empate)\n\n' +
    'Fases del torneo:\n' +
    '1️⃣ Fase de grupos (todos contra todos)\n' +
    '2️⃣ Fase eliminatoria (los mejores clasificados)\n' +
    '3️⃣ Final y tercer puesto'
  );
});

/**
 * Comando /nuevo_torneo
 */
bot.onText(/\/nuevo_torneo/, (msg) => {
  const chatId = msg.chat.id;
  
  userStates.set(chatId, { action: 'awaiting_players' });
  
  bot.sendMessage(chatId,
    '🎯 *Crear nuevo torneo*\n\n' +
    'Por favor, envía los nombres de los participantes separados por comas.\n\n' +
    'Ejemplo: `Juan, María, Pedro, Ana, Luis, Carmen`',
    { parse_mode: 'Markdown' }
  );
});

/**
 * Comando /chatid - Muestra el ID del chat actual
 */
bot.onText(/\/chatid/, (msg) => {
  const chatId = msg.chat.id;
  const chatType = msg.chat.type;
  const chatTitle = msg.chat.title || 'Chat privado';
  
  bot.sendMessage(chatId,
    `🆔 Información del Chat\n\n` +
    `Chat ID: ${chatId}\n` +
    `Tipo: ${chatType}\n` +
    `Nombre: ${chatTitle}\n\n` +
    `Copia este ID y úsalo en el archivo tournaments.json`
  );
});

/**
 * Comando /clasificacion
 */
bot.onText(/\/clasificacion/, (msg) => {
  const chatId = msg.chat.id;
  console.log(`🔍 Buscando torneo para Chat ID: ${chatId}, tipo: ${typeof chatId}`);
  console.log(`🔍 Torneos disponibles:`, Array.from(tournaments.keys()));
  
  const tournament = tournaments.get(chatId);

  if (!tournament) {
    bot.sendMessage(chatId, 
      `❌ No hay ningún torneo activo en este chat.\n\n` +
      `🆔 El Chat ID de este chat es: ${chatId}\n\n` +
      `Para importar tu torneo existente, reemplaza "YOUR_CHAT_ID" en data/tournaments.json con este número.\n\n` +
      `O usa /nuevo_torneo para crear uno nuevo.`
    );
    return;
  }

  const standings = tournament.getStandings();
  
  let message = '🏆 *CLASIFICACIÓN*\n\n';
  
  standings.forEach((player, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
    message += `${medal} *${player.name}*\n`;
    message += `   Puntos: ${player.points} | PJ: ${player.matchesPlayed} | `;
    message += `V: ${player.wins} | E: ${player.draws} | D: ${player.losses}\n\n`;
  });

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

/**
 * Comando /todas_jornadas
 */
bot.onText(/\/todas_jornadas/, (msg) => {
  const chatId = msg.chat.id;
  const tournament = tournaments.get(chatId);

  if (!tournament) {
    bot.sendMessage(chatId, '❌ No hay ningún torneo activo. Usa /nuevo_torneo para crear uno.');
    return;
  }

  let message = '📅 *TODAS LAS JORNADAS*\n\n';

  if (tournament.currentPhase === 'setup') {
    bot.sendMessage(chatId, '❌ El torneo aún no ha comenzado.');
    return;
  }

  // Jornadas de fase de grupos
  if (tournament.groupStageMatches.length > 0) {
    const maxRound = Math.max(...tournament.groupStageMatches.map(m => m.round));
    
    for (let r = 1; r <= maxRound; r++) {
      const matches = tournament.getRoundMatches(r);
      if (matches.length > 0) {
        message += `*Jornada ${r}*\n`;
        matches.forEach(match => {
          const result = match.result || 'Pendiente';
          message += `  ${match.id}. ${match.player1.name} vs ${match.player2.name} - ${result}\n`;
        });
        message += '\n';
      }
    }
  }

  // Fase eliminatoria
  if (tournament.eliminationMatches.length > 0) {
    message += '*FASE ELIMINATORIA*\n\n';
    
    const semifinals = tournament.eliminationMatches.filter(m => m.round === 'semifinals');
    if (semifinals.length > 0) {
      message += '*Semifinales*\n';
      semifinals.forEach(match => {
        const result = match.result || 'Pendiente';
        message += `  ${match.id}. ${match.player1.name} vs ${match.player2.name} - ${result}\n`;
      });
      message += '\n';
    }

    const thirdPlace = tournament.eliminationMatches.find(m => m.round === 'third_place');
    if (thirdPlace) {
      message += '*Tercer puesto*\n';
      const result = thirdPlace.result || 'Pendiente';
      message += `  ${thirdPlace.id}. ${thirdPlace.player1.name} vs ${thirdPlace.player2.name} - ${result}\n\n`;
    }

    const final = tournament.eliminationMatches.find(m => m.round === 'final');
    if (final) {
      message += '*🏆 FINAL*\n';
      const result = final.result || 'Pendiente';
      message += `  ${final.id}. ${final.player1.name} vs ${final.player2.name} - ${result}\n`;
    }
  }

  // Dividir mensaje si es muy largo
  if (message.length > 4096) {
    const parts = message.match(/[\s\S]{1,4096}/g);
    parts.forEach(part => bot.sendMessage(chatId, part, { parse_mode: 'Markdown' }));
  } else {
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }
});

/**
 * Comando /ultima_jornada
 */
bot.onText(/\/ultima_jornada/, (msg) => {
  const chatId = msg.chat.id;
  const tournament = tournaments.get(chatId);

  if (!tournament) {
    bot.sendMessage(chatId, '❌ No hay ningún torneo activo. Usa /nuevo_torneo para crear uno.');
    return;
  }

  const lastRound = tournament.getLastCompletedRound();

  if (!lastRound) {
    bot.sendMessage(chatId, '❌ No hay jornadas completadas todavía.');
    return;
  }

  let message = '⏮️ *ÚLTIMA JORNADA COMPLETADA*\n\n';

  if (lastRound.round === 'completed_elimination') {
    message += '*Fase eliminatoria*\n';
  } else {
    message += `*Jornada ${lastRound.round}*\n`;
  }

  lastRound.matches.forEach(match => {
    message += `${match.id}. ${match.player1.name} vs ${match.player2.name} - ${match.result}\n`;
  });

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

/**
 * Comando /jornada_actual
 */
bot.onText(/\/jornada_actual/, (msg) => {
  const chatId = msg.chat.id;
  const tournament = tournaments.get(chatId);

  if (!tournament) {
    bot.sendMessage(chatId, '❌ No hay ningún torneo activo. Usa /nuevo_torneo para crear uno.');
    return;
  }

  const currentMatches = tournament.getCurrentRoundMatches();

  if (currentMatches.length === 0) {
    bot.sendMessage(chatId, '✅ No hay partidos pendientes en la jornada actual.');
    return;
  }

  let message = '▶️ *JORNADA ACTUAL*\n\n';

  if (tournament.currentPhase === 'group_stage') {
    message += `*Jornada ${tournament.currentRound}*\n`;
  } else if (tournament.currentPhase === 'elimination') {
    message += '*Fase eliminatoria*\n';
  }

  currentMatches.forEach(match => {
    const status = match.result ? `✅ ${match.result}` : '⏳ Pendiente';
    message += `${match.id}. ${match.player1.name} vs ${match.player2.name} - ${status}\n`;
  });

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

/**
 * Comando /proximas_jornadas
 */
bot.onText(/\/proximas_jornadas/, (msg) => {
  const chatId = msg.chat.id;
  const tournament = tournaments.get(chatId);

  if (!tournament) {
    bot.sendMessage(chatId, '❌ No hay ningún torneo activo. Usa /nuevo_torneo para crear uno.');
    return;
  }

  const upcoming = tournament.getUpcomingMatches();

  if (!upcoming || upcoming.length === 0) {
    if (tournament.currentPhase === 'finished') {
      bot.sendMessage(chatId, '🏁 El torneo ha finalizado.');
    } else {
      bot.sendMessage(chatId, '❌ No hay próximas jornadas programadas.');
    }
    return;
  }

  let message = '⏭️ *PRÓXIMAS JORNADAS*\n\n';

  if (Array.isArray(upcoming) && upcoming[0] && upcoming[0].round) {
    // Jornadas de fase de grupos
    upcoming.forEach(roundData => {
      message += `*Jornada ${roundData.round}*\n`;
      roundData.matches.forEach(match => {
        message += `  ${match.id}. ${match.player1.name} vs ${match.player2.name}\n`;
      });
      message += '\n';
    });
  } else {
    // Fase eliminatoria
    message += '*Fase eliminatoria*\n';
    upcoming.forEach(match => {
      const roundName = match.round === 'semifinals' ? 'Semifinal' : 
                       match.round === 'final' ? 'Final' : 
                       match.round === 'third_place' ? 'Tercer puesto' : match.round;
      message += `${match.id}. ${roundName}: ${match.player1.name} vs ${match.player2.name}\n`;
    });
  }

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

/**
 * Comando /registrar_resultado
 */
bot.onText(/\/registrar_resultado/, (msg) => {
  const chatId = msg.chat.id;
  const tournament = tournaments.get(chatId);

  if (!tournament) {
    bot.sendMessage(chatId, '❌ No hay ningún torneo activo. Usa /nuevo_torneo para crear uno.');
    return;
  }

  userStates.set(chatId, { action: 'awaiting_result' });

  bot.sendMessage(chatId,
    '📝 *Registrar resultado*\n\n' +
    'Envía el ID del partido y el resultado separados por un espacio.\n\n' +
    'Ejemplo: `5 1-0`\n\n' +
    'Resultados válidos:\n' +
    '• `1-0` - Gana el primer jugador\n' +
    '• `0-1` - Gana el segundo jugador\n' +
    '• `0.5-0.5` - Empate',
    { parse_mode: 'Markdown' }
  );
});

/**
 * Manejo de mensajes de texto
 */
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Ignorar comandos
  if (text && text.startsWith('/')) {
    return;
  }

  const state = userStates.get(chatId);

  if (!state) {
    return;
  }

  // Procesar según el estado
  if (state.action === 'awaiting_players') {
    // Crear torneo con los jugadores
    const playerNames = text.split(',').map(name => name.trim()).filter(name => name.length > 0);

    if (playerNames.length < 2) {
      bot.sendMessage(chatId, '❌ Necesitas al menos 2 jugadores para crear un torneo.');
      return;
    }

    const tournament = new Tournament('Torneo de Ajedrez');
    tournament.addPlayers(playerNames);
    tournament.generateGroupStage();

    tournaments.set(chatId, tournament);
    userStates.delete(chatId);

    // Guardar automáticamente
    await autoSave();

    let message = '✅ *¡Torneo creado exitosamente!*\n\n';
    message += `👥 Jugadores: ${playerNames.length}\n`;
    message += `📊 Fase: Clasificación (todos contra todos)\n`;
    message += `🎮 Total de partidos: ${tournament.groupStageMatches.length}\n\n`;
    message += 'Usa /jornada_actual para ver los partidos de la primera jornada.';

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

  } else if (state.action === 'awaiting_result') {
    // Registrar resultado
    const parts = text.trim().split(/\s+/);

    if (parts.length !== 2) {
      bot.sendMessage(chatId, '❌ Formato incorrecto. Usa: `ID resultado` (ejemplo: `5 1-0`)', { parse_mode: 'Markdown' });
      return;
    }

    const matchId = parseInt(parts[0]);
    const result = parts[1];

    if (isNaN(matchId)) {
      bot.sendMessage(chatId, '❌ El ID del partido debe ser un número.');
      return;
    }

    const tournament = tournaments.get(chatId);

    if (!tournament) {
      bot.sendMessage(chatId, '❌ No hay ningún torneo activo.');
      userStates.delete(chatId);
      return;
    }

    try {
      const match = tournament.recordMatchResult(matchId, result);
      tournament.advanceRound();

      // Guardar automáticamente
      await autoSave();

      let message = '✅ *Resultado registrado*\n\n';
      message += `${match.player1.name} vs ${match.player2.name}\n`;
      message += `Resultado: ${result}\n\n`;

      // Verificar si se completó la fase de grupos
      if (tournament.isGroupStageComplete() && tournament.currentPhase === 'elimination') {
        message += '🎉 *¡Fase de grupos completada!*\n\n';
        message += 'Generando fase eliminatoria...\n\n';
        
        const standings = tournament.getStandings();
        message += '*Clasificados:*\n';
        const qualified = standings.slice(0, Math.min(8, standings.length));
        qualified.forEach((p, i) => {
          message += `${i + 1}. ${p.name} (${p.points} pts)\n`;
        });

        message += '\nUsa /proximas_jornadas para ver las semifinales.';
      }

      // Verificar si se completaron las semifinales
      const semifinals = tournament.eliminationMatches.filter(m => m.round === 'semifinals');
      if (semifinals.length > 0 && semifinals.every(m => m.result !== null)) {
        const finals = tournament.eliminationMatches.filter(m => m.round === 'final' || m.round === 'third_place');
        if (finals.length === 0) {
          tournament.generateFinals();
          message += '\n\n🏆 *¡Semifinales completadas!*\n';
          message += 'Se ha generado la final y el partido por el tercer puesto.';
        }
      }

      bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      userStates.delete(chatId);

    } catch (error) {
      bot.sendMessage(chatId, `❌ Error: ${error.message}`);
      userStates.delete(chatId);
    }
  }
});

// Manejo de errores
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});
