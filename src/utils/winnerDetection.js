import { doc, updateDoc, getDocs, query, collection, where, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Determines the winner of a competition and updates the competition status
 * @param {string} competitionId - The ID of the competition
 * @param {number} goal - The goal points (default 50000)
 * @returns {Promise<Object>} - Winner information
 */
export async function determineWinner(competitionId, goal = null, options = { finalizeBecauseEnded: false }) {
  try {
    // Get competition details first to check if it has a goal
    const compDoc = await getDoc(doc(db, 'competitions', competitionId));
    if (!compDoc.exists()) {
      return { hasWinner: false, winner: null, message: null };
    }
    
    const competition = compDoc.data();
    const hasGoal = competition.hasGoal !== false; // Default to true for backward compatibility
    const actualGoal = hasGoal ? (competition.goal || goal || 50000) : null;

    // Get all teams for this competition
    const teamsQuery = query(collection(db, 'teams'), where('competitionId', '==', competitionId));
    const teamsSnapshot = await getDocs(teamsQuery);
    const teams = teamsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('DEBUG: Competition ID:', competitionId);
    console.log('DEBUG: Has goal:', hasGoal, 'Goal:', actualGoal);
    console.log('DEBUG: Teams found:', teams.length);
    console.log('DEBUG: All teams data:', teams.map(t => ({ id: t.id, name: t.name, totalPoints: t.totalPoints, members: t.members?.length || 0 })));

    if (teams.length === 0) {
      return { hasWinner: false, winner: null, message: null };
    }

    // Sort teams by points (highest first)
    const sortedTeams = teams.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
    const highestTeam = sortedTeams[0];
    const highestPoints = highestTeam.totalPoints || 0;

    let winnerInfo = {
      hasWinner: false,
      winner: null,
      message: null,
      competitionStatus: 'active',
      tiedTeams: null,
    };

    // For competitions without goals, only determine winner when end date is reached
    if (!hasGoal) {
      if (options && options.finalizeBecauseEnded) {
        // Find the team(s) with highest points
        const winningTeams = teams.filter(team => (team.totalPoints || 0) === highestPoints);
        
        if (winningTeams.length === 1) {
          winnerInfo = {
            hasWinner: true,
            winner: highestTeam,
            message: `🏆 ${highestTeam.name} won the competition!`,
            competitionStatus: 'completed',
            tiedTeams: null
          };
        } else {
          // Multiple teams tied for first place
          const tiedNames = winningTeams.map(team => team.name).join(', ');
          winnerInfo = {
            hasWinner: true,
            winner: winningTeams[0],
            message: `🏆 ${tiedNames} tied for first place!`,
            competitionStatus: 'completed',
            tiedTeams: winningTeams
          };
        }
      } else {
        // Competition is still active, no winner yet
        return { hasWinner: false, winner: null, message: null, competitionStatus: 'active' };
      }
    } else {
      // Competition has a goal - check if any team reached it
      if (highestPoints >= actualGoal) {
        // Find all teams that reached the goal
        const winners = teams.filter(team => (team.totalPoints || 0) >= actualGoal);
      
      if (winners.length === 1) {
        // Only one team reached the goal
        winnerInfo = {
          hasWinner: true,
          winner: highestTeam,
          message: `🏆 ${highestTeam.name} won the competition!`,
          competitionStatus: 'completed',
          tiedTeams: null
        };
      } else {
        // Multiple teams reached the goal - check for ties
        const tiedWinners = winners.filter(team => (team.totalPoints || 0) === highestPoints);
        
        if (tiedWinners.length === 1) {
          // Only one team with highest points (others reached goal but had fewer points)
          winnerInfo = {
            hasWinner: true,
            winner: highestTeam,
            message: `🏆 ${highestTeam.name} won the competition!`,
            competitionStatus: 'completed',
            tiedTeams: null
          };
        } else {
          // Multiple teams tied for first place
          const tiedNames = tiedWinners.map(team => team.name).join(', ');
          winnerInfo = {
            hasWinner: true,
            winner: tiedWinners[0], // Use first tied team as primary winner
            message: `🏆 ${tiedNames} tied for first place!`,
            competitionStatus: 'completed',
            tiedTeams: tiedWinners
          };
        }
      }
      } else {
        // No team reached the goal
        const closestTeams = teams.filter(team => (team.totalPoints || 0) === highestPoints);

        // Only finalize as completed ("no one won") if explicitly called due to end date
        if (options && options.finalizeBecauseEnded) {
          console.log('DEBUG: Finalizing due to end date, no team reached goal');
          if (closestTeams.length === 1) {
            winnerInfo = {
              hasWinner: true,
              winner: highestTeam,
              message: `🏆 No one won! ${highestTeam.name} was the closest with ${highestPoints.toLocaleString()} points.`,
              competitionStatus: 'completed',
              tiedTeams: null
            };
          } else {
            // Multiple teams tied for closest - show all tied teams
            const tiedNames = closestTeams.map(team => team.name).join(', ');
            winnerInfo = {
              hasWinner: true,
              winner: closestTeams[0],
              message: `🏆 No one won! ${tiedNames} tied for closest with ${highestPoints.toLocaleString()} points.`,
              competitionStatus: 'completed',
              tiedTeams: closestTeams
            };
          }
        } else {
          // Do not mark completed; keep competition active
          winnerInfo = {
            hasWinner: false,
            winner: null,
            message: null,
            competitionStatus: 'active',
            tiedTeams: null,
          };
        }
      }
    }

    // Update the competition with winner information
    if (winnerInfo.hasWinner && winnerInfo.competitionStatus === 'completed') {
      console.log('🏆 Updating competition with winner info:', {
        competitionId,
        winner: winnerInfo.winner.name,
        points: winnerInfo.winner.totalPoints,
        message: winnerInfo.message
      });
      
      const updateData = {
        status: winnerInfo.competitionStatus,
        winnerTeamId: winnerInfo.winner.id,
        winnerTeamName: winnerInfo.winner.name,
        winnerPoints: winnerInfo.winner.totalPoints || 0,
        completedAt: new Date().toISOString()
      };
      
      // Add tied teams information if there are ties
      if (winnerInfo.tiedTeams && winnerInfo.tiedTeams.length > 1) {
        updateData.tiedTeamIds = winnerInfo.tiedTeams.map(team => team.id);
        updateData.tiedTeamNames = winnerInfo.tiedTeams.map(team => team.name);
        updateData.isTied = true;
      } else {
        updateData.isTied = false;
      }
      
      await updateDoc(doc(db, 'competitions', competitionId), updateData);
      console.log('✅ Competition updated with winner information');
    } else {
      console.log('❌ No winner to update:', {
        hasWinner: winnerInfo.hasWinner,
        status: winnerInfo.competitionStatus,
        message: winnerInfo.message
      });
    }

    return winnerInfo;
  } catch (error) {
    console.error('Error determining winner:', error);
    return { hasWinner: false, winner: null, message: null };
  }
}

/**
 * Gets the winner message for a specific team
 * @param {string} competitionId - The ID of the competition
 * @param {string} teamId - The ID of the team to check
 * @returns {Promise<string|null>} - Winner message or null
 */
export async function getWinnerMessage(competitionId, teamId) {
  try {
    const compDoc = await getDoc(doc(db, 'competitions', competitionId));
    if (!compDoc.exists()) return null;

    const competition = compDoc.data();
    
    if (competition.status !== 'completed') return null;

    // Check if this team won or tied
    const hasGoal = competition.hasGoal !== false; // Default to true for backward compatibility
    const goal = hasGoal ? (competition.goal || 50000) : null;
    const winnerPoints = competition.winnerPoints || 0;
    const isTied = competition.isTied || false;
    const tiedTeamNames = competition.tiedTeamNames || [];
    
    if (competition.winnerTeamId === teamId || (isTied && tiedTeamNames.includes(competition.winnerTeamName))) {
      // This team won or tied
      if (!hasGoal) {
        // Competition without goal - just show who won
        if (isTied && tiedTeamNames.length > 1) {
          const allTiedNames = tiedTeamNames.join(', ');
          return `🏆 ${allTiedNames} tied for first place!`;
        } else {
          return `🏆 ${competition.winnerTeamName} won the competition!`;
        }
      } else if (winnerPoints >= goal) {
        // Competition with goal and someone reached it
        if (isTied && tiedTeamNames.length > 1) {
          const allTiedNames = tiedTeamNames.join(', ');
          return `🏆 ${allTiedNames} tied for first place!`;
        } else {
          return `🏆 ${competition.winnerTeamName} won the competition!`;
        }
      } else {
        // Competition with goal but no one reached it
        if (isTied && tiedTeamNames.length > 1) {
          const allTiedNames = tiedTeamNames.join(', ');
          return `🏆 No one won! ${allTiedNames} tied for closest with ${winnerPoints.toLocaleString()} points.`;
        } else {
          return `🏆 No one won! ${competition.winnerTeamName} was the closest with ${winnerPoints.toLocaleString()} points.`;
        }
      }
    } else {
      // Another team(s) won or was closest
      if (!hasGoal) {
        // Competition without goal - just show who won
        if (isTied && tiedTeamNames.length > 1) {
          const allTiedNames = tiedTeamNames.join(', ');
          return `🏆 ${allTiedNames} tied for first place!`;
        } else {
          return `🏆 ${competition.winnerTeamName} won the competition!`;
        }
      } else if (winnerPoints >= goal) {
        // Competition with goal and someone reached it
        if (isTied && tiedTeamNames.length > 1) {
          const allTiedNames = tiedTeamNames.join(', ');
          return `🏆 ${allTiedNames} tied for first place!`;
        } else {
          return `🏆 ${competition.winnerTeamName} won the competition!`;
        }
      } else {
        // Competition with goal but no one reached it
        if (isTied && tiedTeamNames.length > 1) {
          const allTiedNames = tiedTeamNames.join(', ');
          return `🏆 No one won! ${allTiedNames} tied for closest with ${winnerPoints.toLocaleString()} points.`;
        } else {
          return `🏆 No one won! ${competition.winnerTeamName} was the closest with ${winnerPoints.toLocaleString()} points.`;
        }
      }
    }
  } catch (error) {
    console.error('Error getting winner message:', error);
    return null;
  }
}

/**
 * Checks for expired competitions and determines winners
 * @returns {Promise<void>}
 */
export async function checkExpiredCompetitions() {
  try {
    console.log('🔍 Checking for expired competitions...');
    
    // Get all active competitions
    const competitionsQuery = query(
      collection(db, 'competitions'),
      where('status', '==', 'active')
    );
    const competitionsSnapshot = await getDocs(competitionsQuery);
    
    const now = new Date();
    const expiredCompetitions = [];
    
    competitionsSnapshot.forEach(doc => {
      const competition = { id: doc.id, ...doc.data() };
      if (competition.endDate) {
        const endDate = new Date(competition.endDate);
        if (endDate <= now) {
          expiredCompetitions.push(competition);
        }
      }
    });
    
    console.log(`Found ${expiredCompetitions.length} expired competitions`);
    
    // Process each expired competition
    for (const competition of expiredCompetitions) {
      console.log(`\n🔄 Processing expired competition: ${competition.name}`);
      console.log(`   Competition ID: ${competition.id}`);
      console.log(`   Competition end date: ${competition.endDate}`);
      console.log(`   Current time: ${new Date().toISOString()}`);
      console.log(`   Has goal: ${competition.hasGoal}, Goal: ${competition.goal}`);
      console.log(`   Current status: ${competition.status}`);
      
      // For competitions without goals, pass null as the goal
      const goal = competition.hasGoal !== false ? (competition.goal || 50000) : null;
      const result = await determineWinner(competition.id, goal, { finalizeBecauseEnded: true });
      
      console.log(`   Winner detection result:`, {
        hasWinner: result.hasWinner,
        winner: result.winner?.name,
        message: result.message,
        status: result.competitionStatus
      });
    }
    
    if (expiredCompetitions.length > 0) {
      console.log(`Processed ${expiredCompetitions.length} expired competitions`);
    }
  } catch (error) {
    console.error('Error checking expired competitions:', error);
  }
}
