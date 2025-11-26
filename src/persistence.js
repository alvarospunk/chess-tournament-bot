import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = './data';
const TOURNAMENTS_FILE = path.join(DATA_DIR, 'tournaments.json');

/**
 * Asegura que el directorio de datos existe
 */
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

/**
 * Carga todos los torneos desde el archivo
 */
export async function loadTournaments() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(TOURNAMENTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Si el archivo no existe, retornar objeto vacío
    return {};
  }
}

/**
 * Guarda todos los torneos en el archivo
 */
export async function saveTournaments(tournaments) {
  try {
    await ensureDataDir();
    
    // Convertir el Map a un objeto serializable
    const tournamentData = {};
    
    for (const [chatId, tournament] of tournaments.entries()) {
      tournamentData[chatId] = {
        name: tournament.name,
        players: tournament.players,
        groupStageMatches: tournament.groupStageMatches,
        eliminationMatches: tournament.eliminationMatches,
        standings: Array.from(tournament.standings.entries()),
        currentPhase: tournament.currentPhase,
        currentRound: tournament.currentRound,
        matchResults: Array.from(tournament.matchResults.entries())
      };
    }
    
    await fs.writeFile(TOURNAMENTS_FILE, JSON.stringify(tournamentData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error guardando torneos:', error);
  }
}

/**
 * Restaura los torneos desde el formato serializado
 */
export function restoreTournaments(data) {
  const tournaments = new Map();
  
  for (const [chatId, tournamentData] of Object.entries(data)) {
    // Convertir chatId a número para que coincida con el tipo que envía Telegram
    const numericChatId = parseInt(chatId);
    
    // Crear objeto que simula un Tournament con todos sus métodos
    const tournament = {
      name: tournamentData.name,
      players: tournamentData.players,
      groupStageMatches: tournamentData.groupStageMatches,
      eliminationMatches: tournamentData.eliminationMatches,
      standings: new Map(tournamentData.standings),
      currentPhase: tournamentData.currentPhase,
      currentRound: tournamentData.currentRound,
      matchResults: new Map(tournamentData.matchResults),
      
      // Métodos necesarios
      recordMatchResult: function(matchId, result) {
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

        if (!['1-0', '0-1', '0.5-0.5'].includes(result)) {
          throw new Error('Resultado inválido. Use: 1-0, 0-1, o 0.5-0.5');
        }

        match.result = result;
        this.matchResults.set(matchId, result);

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

        if (isGroupStage && this.isGroupStageComplete()) {
          this.generateEliminationPhase();
        }

        return match;
      },
      
      advanceRound: function() {
        if (this.currentPhase === 'group_stage') {
          const currentRoundMatches = this.getRoundMatches(this.currentRound);
          if (currentRoundMatches.every(m => m.result !== null)) {
            this.currentRound++;
          }
        }
      },
      
      getStandings: function() {
        return Array.from(this.standings.values())
          .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.wins !== a.wins) return b.wins - a.wins;
            return a.name.localeCompare(b.name);
          });
      },
      
      getRoundMatches: function(roundNumber) {
        return this.groupStageMatches.filter(m => m.round === roundNumber);
      },
      
      getCurrentRoundMatches: function() {
        if (this.currentPhase === 'group_stage') {
          return this.getRoundMatches(this.currentRound);
        } else if (this.currentPhase === 'elimination') {
          return this.eliminationMatches.filter(m => m.result === null);
        }
        return [];
      },
      
      getLastCompletedRound: function() {
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
      },
      
      getUpcomingMatches: function() {
        if (this.currentPhase === 'group_stage') {
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
      },
      
      isGroupStageComplete: function() {
        return this.groupStageMatches.every(m => m.result !== null);
      },
      
      generateEliminationPhase: function() {
        const sortedPlayers = Array.from(this.standings.values())
          .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return b.wins - a.wins;
          });

        let qualifiedCount = Math.min(8, sortedPlayers.length);
        
        if (qualifiedCount > 4) qualifiedCount = 8;
        else if (qualifiedCount > 2) qualifiedCount = 4;
        else qualifiedCount = 2;

        const qualified = sortedPlayers.slice(0, qualifiedCount);

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
      },
      
      generateFinals: function() {
        const semifinals = this.eliminationMatches.filter(m => m.round === 'semifinals');
        
        if (semifinals.some(m => m.result === null)) {
          throw new Error('Todas las semifinales deben completarse antes de generar la final');
        }

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

        const finalMatch = {
          id: maxMatchId + 1,
          round: 'final',
          player1: winners[0],
          player2: winners[1],
          result: null,
          phase: 'elimination'
        };

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
    };
    
    tournaments.set(numericChatId, tournament);
  }
  
  return tournaments;
}
