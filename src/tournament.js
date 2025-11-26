/**
 * Clase para gestionar un torneo de ajedrez
 */
export class Tournament {
  constructor(name) {
    this.name = name;
    this.players = [];
    this.groupStageMatches = [];
    this.eliminationMatches = [];
    this.standings = new Map();
    this.currentPhase = 'setup'; // setup, group_stage, elimination, finished
    this.currentRound = 0;
    this.matchResults = new Map();
  }

  /**
   * Añade jugadores al torneo
   */
  addPlayers(playerNames) {
    this.players = playerNames.map((name, index) => ({
      id: index + 1,
      name: name.trim(),
      points: 0,
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0
    }));

    // Inicializar standings
    this.players.forEach(player => {
      this.standings.set(player.id, player);
    });
  }

  /**
   * Genera todas las partidas de la fase de grupos (round-robin)
   */
  generateGroupStage() {
    const matches = [];
    let matchId = 1;
    let round = 1;

    // Algoritmo round-robin para generar todas las combinaciones
    const n = this.players.length;
    const rounds = n % 2 === 0 ? n - 1 : n;
    const matchesPerRound = Math.floor(n / 2);

    // Para implementar round-robin correctamente
    const playerList = [...this.players];
    
    // Si hay número impar de jugadores, añadir un "bye"
    if (n % 2 === 1) {
      playerList.push({ id: -1, name: 'BYE' });
    }

    const totalPlayers = playerList.length;

    for (let r = 0; r < totalPlayers - 1; r++) {
      const roundMatches = [];
      
      for (let m = 0; m < totalPlayers / 2; m++) {
        const home = (r + m) % (totalPlayers - 1);
        const away = (totalPlayers - 1 - m + r) % (totalPlayers - 1);

        const homePlayer = home === totalPlayers - 1 ? playerList[totalPlayers - 1] : playerList[home];
        const awayPlayer = away === totalPlayers - 1 ? playerList[totalPlayers - 1] : playerList[away];

        // No crear partidas con BYE
        if (homePlayer.id !== -1 && awayPlayer.id !== -1) {
          roundMatches.push({
            id: matchId++,
            round: r + 1,
            player1: homePlayer,
            player2: awayPlayer,
            result: null, // null, '1-0', '0-1', '0.5-0.5'
            phase: 'group_stage'
          });
        }
      }

      if (roundMatches.length > 0) {
        matches.push(...roundMatches);
      }
    }

    this.groupStageMatches = matches;
    this.currentPhase = 'group_stage';
    this.currentRound = 1;

    return matches;
  }

  /**
   * Registra el resultado de un partido
   */
  recordMatchResult(matchId, result) {
    // Buscar el partido
    let match = this.groupStageMatches.find(m => m.id === matchId);
    let isGroupStage = true;

    if (!match) {
      match = this.eliminationMatches.find(m => m.id === matchId);
      isGroupStage = false;
    }

    if (!match) {
      throw new Error('Partido no encontrado');
    }

    if (match.result !== null) {
      throw new Error('Este partido ya tiene un resultado registrado');
    }

    // Validar resultado
    if (!['1-0', '0-1', '0.5-0.5'].includes(result)) {
      throw new Error('Resultado inválido. Use: 1-0, 0-1, o 0.5-0.5');
    }

    match.result = result;
    this.matchResults.set(matchId, result);

    // Actualizar estadísticas
    const player1 = this.standings.get(match.player1.id);
    const player2 = this.standings.get(match.player2.id);

    player1.matchesPlayed++;
    player2.matchesPlayed++;

    if (result === '1-0') {
      player1.points += 3;
      player1.wins++;
      player2.losses++;
    } else if (result === '0-1') {
      player2.points += 3;
      player2.wins++;
      player1.losses++;
    } else if (result === '0.5-0.5') {
      player1.points += 1;
      player2.points += 1;
      player1.draws++;
      player2.draws++;
    }

    // Verificar si la fase de grupos ha terminado
    if (isGroupStage && this.isGroupStageComplete()) {
      this.generateEliminationPhase();
    }

    return match;
  }

  /**
   * Verifica si la fase de grupos está completa
   */
  isGroupStageComplete() {
    return this.groupStageMatches.every(m => m.result !== null);
  }

  /**
   * Genera la fase eliminatoria basada en los resultados de grupos
   */
  generateEliminationPhase() {
    // Ordenar jugadores por puntos
    const sortedPlayers = Array.from(this.standings.values())
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.wins - a.wins; // Desempate por victorias
      });

    // Determinar cuántos jugadores pasan a eliminatorias
    // Si hay 8 o más jugadores, top 8; si hay menos, todos pasan
    let qualifiedCount = Math.min(8, sortedPlayers.length);
    
    // Asegurar que sea potencia de 2
    if (qualifiedCount > 4) qualifiedCount = 8;
    else if (qualifiedCount > 2) qualifiedCount = 4;
    else qualifiedCount = 2;

    const qualified = sortedPlayers.slice(0, qualifiedCount);

    // Generar emparejamientos (1 vs último, 2 vs penúltimo, etc.)
    const matches = [];
    let matchId = this.groupStageMatches.length + 1;

    for (let i = 0; i < qualified.length / 2; i++) {
      matches.push({
        id: matchId++,
        round: 'semifinals',
        player1: qualified[i],
        player2: qualified[qualified.length - 1 - i],
        result: null,
        phase: 'elimination'
      });
    }

    this.eliminationMatches = matches;
    this.currentPhase = 'elimination';

    return matches;
  }

  /**
   * Genera la final y partido por tercer puesto
   */
  generateFinals() {
    const semifinals = this.eliminationMatches.filter(m => m.round === 'semifinals');
    
    if (semifinals.some(m => m.result === null)) {
      throw new Error('Todas las semifinales deben completarse antes de generar la final');
    }

    // Obtener ganadores y perdedores
    const winners = [];
    const losers = [];

    semifinals.forEach(match => {
      if (match.result === '1-0') {
        winners.push(match.player1);
        losers.push(match.player2);
      } else if (match.result === '0-1') {
        winners.push(match.player2);
        losers.push(match.player1);
      } else {
        // En caso de empate, gana el de mayor puntuación en grupos
        const p1 = this.standings.get(match.player1.id);
        const p2 = this.standings.get(match.player2.id);
        if (p1.points >= p2.points) {
          winners.push(match.player1);
          losers.push(match.player2);
        } else {
          winners.push(match.player2);
          losers.push(match.player1);
        }
      }
    });

    const maxMatchId = Math.max(...this.eliminationMatches.map(m => m.id));

    // Final
    const finalMatch = {
      id: maxMatchId + 1,
      round: 'final',
      player1: winners[0],
      player2: winners[1],
      result: null,
      phase: 'elimination'
    };

    // Tercer puesto
    const thirdPlaceMatch = {
      id: maxMatchId + 2,
      round: 'third_place',
      player1: losers[0],
      player2: losers[1],
      result: null,
      phase: 'elimination'
    };

    this.eliminationMatches.push(finalMatch, thirdPlaceMatch);

    return { finalMatch, thirdPlaceMatch };
  }

  /**
   * Obtiene la clasificación actual
   */
  getStandings() {
    return Array.from(this.standings.values())
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.name.localeCompare(b.name);
      });
  }

  /**
   * Obtiene los partidos de una jornada específica
   */
  getRoundMatches(roundNumber) {
    return this.groupStageMatches.filter(m => m.round === roundNumber);
  }

  /**
   * Obtiene todos los partidos de la jornada actual
   */
  getCurrentRoundMatches() {
    if (this.currentPhase === 'group_stage') {
      return this.getRoundMatches(this.currentRound);
    } else if (this.currentPhase === 'elimination') {
      return this.eliminationMatches.filter(m => m.result === null);
    }
    return [];
  }

  /**
   * Obtiene la última jornada completada
   */
  getLastCompletedRound() {
    if (this.currentPhase === 'group_stage') {
      for (let r = this.currentRound - 1; r >= 1; r--) {
        const matches = this.getRoundMatches(r);
        if (matches.length > 0 && matches.every(m => m.result !== null)) {
          return { round: r, matches };
        }
      }
    } else if (this.currentPhase === 'elimination') {
      const completed = this.eliminationMatches.filter(m => m.result !== null);
      if (completed.length > 0) {
        return { round: 'completed_elimination', matches: completed };
      }
    }
    return null;
  }

  /**
   * Obtiene las próximas jornadas o fases
   */
  getUpcomingMatches() {
    if (this.currentPhase === 'group_stage') {
      // Obtener todas las jornadas pendientes
      const maxRound = Math.max(...this.groupStageMatches.map(m => m.round));
      const upcoming = [];
      
      for (let r = this.currentRound + 1; r <= maxRound; r++) {
        const matches = this.getRoundMatches(r);
        if (matches.length > 0) {
          upcoming.push({ round: r, matches });
        }
      }
      
      return upcoming;
    } else if (this.currentPhase === 'elimination') {
      return this.eliminationMatches.filter(m => m.result === null);
    }
    return [];
  }

  /**
   * Avanza a la siguiente jornada
   */
  advanceRound() {
    if (this.currentPhase === 'group_stage') {
      const currentRoundMatches = this.getRoundMatches(this.currentRound);
      if (currentRoundMatches.every(m => m.result !== null)) {
        this.currentRound++;
      }
    }
  }
}
