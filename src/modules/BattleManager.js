/**
 * Battle resolution and combat management system
 */

import { DEVELOPMENT_CONFIG } from '../utils/Constants.js';

export class BattleManager {
    constructor(random) {
        this.random = random;
        this.battles = [];
        this.battleStats = {
            totalBattles: 0,
            totalCasualties: 0,
            avgBattlePower: 0
        };
    }

    /**
     * Initiate battle between attacking army and defending position
     */
    initiateBattle(attackingArmy, targetX, targetY, map, nations) {
        const targetCell = map[targetX][targetY];
        const defendingNation = nations[targetCell.owner];
        const attackingNation = nations[attackingArmy.nationId];

        // Find defending armies
        const defendingArmies = this.findDefendingArmies(targetCell);
        
        // Calculate battle powers
        const attackPower = this.calculateAttackPower(attackingArmy);
        const defensePower = this.calculateDefensePower(defendingArmies, targetCell);
        
        // Roll dice for battle resolution
        const attackRoll = this.rollDice(6);
        const defenseRoll = this.rollDice(6);
        
        const finalAttackPower = attackPower + attackRoll;
        const finalDefensePower = defensePower + defenseRoll;
        
        // Create battle record
        const battle = {
            turn: 0, // Will be set by caller
            attacker: attackingNation.name,
            defender: defendingNation.name,
            location: { x: targetX, y: targetY },
            attackPower: finalAttackPower,
            defensePower: finalDefensePower,
            attackRoll: attackRoll,
            defenseRoll: defenseRoll,
            winner: null,
            casualties: [],
            experienceGained: 0
        };

        // Resolve battle
        if (finalAttackPower > finalDefensePower) {
            this.resolveAttackerVictory(battle, attackingArmy, defendingArmies, targetCell, map, nations);
        } else {
            this.resolveDefenderVictory(battle, attackingArmy, defendingArmies);
        }

        // Record battle
        this.battles.push(battle);
        attackingNation.addBattle(battle);
        defendingNation.addBattle(battle);
        this.battleStats.totalBattles++;

        return battle;
    }

    /**
     * Find all defending armies in a cell
     */
    findDefendingArmies(cell) {
        const armies = [];
        
        for (let i = 0; i < cell.innerGrid.length; i++) {
            for (let j = 0; j < cell.innerGrid[i].length; j++) {
                const innerCell = cell.innerGrid[i][j];
                if (innerCell.army && innerCell.army.nationId === cell.owner) {
                    armies.push(innerCell.army);
                }
            }
        }
        
        return armies;
    }

    /**
     * Calculate total attack power
     */
    calculateAttackPower(army) {
        let power = army.getCombatPower();
        
        // Experience bonus
        if (army.isVeteran()) {
            power += 2;
        }
        
        return power;
    }

    /**
     * Calculate total defense power
     */
    calculateDefensePower(armies, cell) {
        let power = armies.reduce((total, army) => total + army.getCombatPower(), 0);
        
        // Defensive structures bonus
        if (cell.development === 'castle') {
            power += DEVELOPMENT_CONFIG.castle.defenseBonus;
        }
        
        // Check for castles in inner grid
        for (let i = 0; i < cell.innerGrid.length; i++) {
            for (let j = 0; j < cell.innerGrid[i].length; j++) {
                if (cell.innerGrid[i][j].development === 'castle') {
                    power += DEVELOPMENT_CONFIG.castle.defenseBonus;
                }
            }
        }
        
        // Terrain defensive bonus
        if (cell.terrain === 'mountain') {
            power += 1;
        }
        
        return Math.max(1, power); // Minimum defense of 1
    }

    /**
     * Roll dice
     */
    rollDice(sides) {
        return this.random.randomInt(1, sides);
    }

    /**
     * Resolve attacker victory
     */
    resolveAttackerVictory(battle, attackingArmy, defendingArmies, targetCell, map, nations) {
        battle.winner = battle.attacker;
        
        // Remove defending armies
        for (const army of defendingArmies) {
            this.removeArmyFromBattle(army, nations);
            battle.casualties.push({
                nation: battle.defender,
                armyLevel: army.level,
                type: 'destroyed'
            });
        }
        
        // Transfer territory
        const oldOwner = targetCell.owner;
        targetCell.owner = attackingArmy.nationId;
        
        // Update nation territories
        const defendingNation = nations[oldOwner];
        const attackingNation = nations[attackingArmy.nationId];
        
        defendingNation.removeTerritory(targetCell.x, targetCell.y);
        attackingNation.addTerritory(targetCell.x, targetCell.y);
        
        // Award experience
        const experienceGained = 20 + (defendingArmies.length * 10);
        battle.experienceGained = experienceGained;
        attackingArmy.recordBattle(true, experienceGained);
    }

    /**
     * Resolve defender victory
     */
    resolveDefenderVictory(battle, attackingArmy, defendingArmies) {
        battle.winner = battle.defender;
        
        // Attacking army takes damage or is destroyed
        const powerDiff = battle.defensePower - battle.attackPower;
        
        if (powerDiff > 5 || this.random.probability(0.5)) {
            // Army destroyed
            this.removeArmyFromBattle(attackingArmy, nations);
            battle.casualties.push({
                nation: battle.attacker,
                armyLevel: attackingArmy.level,
                type: 'destroyed'
            });
        } else {
            // Army damaged
            const damage = Math.min(50, powerDiff * 10);
            attackingArmy.takeDamage(damage);
            battle.casualties.push({
                nation: battle.attacker,
                armyLevel: attackingArmy.level,
                type: 'damaged',
                damage: damage
            });
        }
        
        // Award experience to defenders
        const experienceGained = 15;
        battle.experienceGained = experienceGained;
        
        for (const army of defendingArmies) {
            army.recordBattle(true, experienceGained);
        }
        
        attackingArmy.recordBattle(false, 5); // Small experience for attempting
    }

    /**
     * Remove army from battle (and from nation)
     */
    removeArmyFromBattle(army, nations) {
        const nation = nations[army.nationId];
        nation.removeArmy(army);
        this.battleStats.totalCasualties++;
    }

    /**
     * Get all battles
     */
    getAllBattles() {
        return this.battles;
    }

    /**
     * Get recent battles
     */
    getRecentBattles(count = 10) {
        return this.battles.slice(-count).reverse();
    }

    /**
     * Get battle statistics
     */
    getBattleStats() {
        return {
            ...this.battleStats,
            avgBattlePower: this.battles.length > 0 ? 
                this.battles.reduce((sum, b) => sum + b.attackPower + b.defensePower, 0) / (this.battles.length * 2) : 0
        };
    }

    /**
     * Create detailed battle log message
     */
    createBattleLogMessage(battle) {
        let message = `${battle.attacker} attacks ${battle.defender} at (${battle.location.x}, ${battle.location.y})\n`;
        message += `⚔️ Attack: ${battle.attackPower} (${battle.attackPower - battle.attackRoll} + ${battle.attackRoll}🎲)\n`;
        message += `🛡️ Defense: ${battle.defensePower} (${battle.defensePower - battle.defenseRoll} + ${battle.defenseRoll}🎲)\n`;
        message += `🏆 Winner: ${battle.winner}\n`;
        
        if (battle.casualties.length > 0) {
            message += `💀 Casualties: ${battle.casualties.length} units\n`;
        }
        
        if (battle.experienceGained > 0) {
            message += `⭐ Experience: +${battle.experienceGained}`;
        }
        
        return message;
    }
}
