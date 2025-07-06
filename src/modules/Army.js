/**
 * Army class with enhanced functionality
 */

import { GAME_CONFIG } from '../utils/Constants.js';
import { validateArmyLevel, validateOrder, validateCoordinates } from '../utils/ValidationUtils.js';

export class Army {
    constructor(nationId, x, y, innerX = null, innerY = null) {
        this.nationId = nationId;
        
        // Position validation
        const mainPos = validateCoordinates(x, y, GAME_CONFIG.MAP_SIZE);
        this.x = mainPos.x;
        this.y = mainPos.y;
        
        if (innerX !== null && innerY !== null) {
            const innerPos = validateCoordinates(innerX, innerY, GAME_CONFIG.INNER_SIZE);
            this.innerX = innerPos.x;
            this.innerY = innerPos.y;
        } else {
            this.innerX = null;
            this.innerY = null;
        }
        
        // Army stats
        this.level = 1;
        this.health = 100;
        this.experience = 0;
        this.movementPoints = GAME_CONFIG.ARMY_MOVEMENT_POINTS;
        this.maxMovementPoints = GAME_CONFIG.ARMY_MOVEMENT_POINTS;
        
        // Orders and AI
        this.orders = null;
        this.target = null; // Current target position or enemy
        this.lastAction = null;
        
        // Combat stats
        this.victories = 0;
        this.defeats = 0;
        this.battlesParticipated = 0;
        
        // Creation time for tracking age
        this.createdTurn = 0;
    }

    /**
     * Set army position in main grid
     */
    setPosition(x, y) {
        const pos = validateCoordinates(x, y, GAME_CONFIG.MAP_SIZE);
        this.x = pos.x;
        this.y = pos.y;
    }

    /**
     * Set army position in inner grid
     */
    setInnerPosition(innerX, innerY) {
        if (innerX !== null && innerY !== null) {
            const pos = validateCoordinates(innerX, innerY, GAME_CONFIG.INNER_SIZE);
            this.innerX = pos.x;
            this.innerY = pos.y;
        } else {
            this.innerX = null;
            this.innerY = null;
        }
    }

    /**
     * Set army level with validation
     */
    setLevel(level) {
        this.level = validateArmyLevel(level);
    }

    /**
     * Set army orders
     */
    setOrders(orders) {
        this.orders = validateOrder(orders);
    }

    /**
     * Reset movement points for new turn
     */
    resetMovementPoints() {
        this.movementPoints = this.maxMovementPoints;
    }

    /**
     * Use movement points
     */
    useMovementPoints(points) {
        this.movementPoints = Math.max(0, this.movementPoints - points);
    }

    /**
     * Check if army can move
     */
    canMove() {
        return this.movementPoints > 0 && this.health > 0;
    }

    /**
     * Take damage
     */
    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        return this.health <= 0; // Return true if army is destroyed
    }

    /**
     * Heal army
     */
    heal(amount) {
        this.health = Math.min(100, this.health + amount);
    }

    /**
     * Gain experience
     */
    gainExperience(amount) {
        this.experience += amount;
        
        // Check for level up (every 100 experience points)
        const newLevel = Math.min(10, Math.floor(this.experience / 100) + 1);
        if (newLevel > this.level) {
            this.setLevel(newLevel);
            return true; // Level up occurred
        }
        return false;
    }

    /**
     * Get army's combat power
     */
    getCombatPower() {
        let power = this.level;
        
        // Health affects combat power
        power *= (this.health / 100);
        
        // Experience bonus
        power += Math.floor(this.experience / 50) * 0.5;
        
        return Math.max(1, Math.floor(power));
    }

    /**
     * Get upkeep cost for this army
     */
    getUpkeepCost() {
        return GAME_CONFIG.ARMY_UPKEEP + Math.floor(this.level / 2);
    }

    /**
     * Check if army is veteran (high experience)
     */
    isVeteran() {
        return this.experience >= 200 || this.level >= 5;
    }

    /**
     * Get army status description
     */
    getStatus() {
        if (this.health <= 25) return 'wounded';
        if (this.health <= 50) return 'damaged';
        if (this.movementPoints <= 0) return 'exhausted';
        if (this.isVeteran()) return 'veteran';
        return 'ready';
    }

    /**
     * Get movement cost for terrain
     */
    getMovementCost(terrain) {
        switch (terrain) {
            case 'ocean':
                return 4; // Slow movement through water
            case 'mountain':
                return Infinity; // Cannot move through mountains
            case 'river':
                return 1; // Fast movement along rivers
            case 'land':
            default:
                return 1; // Normal movement
        }
    }

    /**
     * Calculate distance to target
     */
    getDistanceTo(targetX, targetY) {
        return Math.sqrt(
            Math.pow(this.x - targetX, 2) + 
            Math.pow(this.y - targetY, 2)
        );
    }

    /**
     * Set target for AI
     */
    setTarget(targetX, targetY, targetType = 'move') {
        this.target = {
            x: targetX,
            y: targetY,
            type: targetType
        };
    }

    /**
     * Clear target
     */
    clearTarget() {
        this.target = null;
    }

    /**
     * Record battle participation
     */
    recordBattle(won, experienceGained = 0) {
        this.battlesParticipated++;
        if (won) {
            this.victories++;
        } else {
            this.defeats++;
        }
        this.gainExperience(experienceGained);
    }

    /**
     * Get win rate
     */
    getWinRate() {
        return this.battlesParticipated > 0 ? 
            (this.victories / this.battlesParticipated) : 0;
    }

    /**
     * Check if army needs rest/healing
     */
    needsRest() {
        return this.health < 75 || this.movementPoints <= 0;
    }

    /**
     * Get army efficiency (0-1)
     */
    getEfficiency() {
        let efficiency = 1.0;
        
        // Health affects efficiency
        efficiency *= (this.health / 100);
        
        // Low movement points reduce efficiency
        if (this.movementPoints <= 0) {
            efficiency *= 0.5;
        }
        
        return Math.max(0.1, efficiency);
    }

    /**
     * Get creation cost for army of this level
     */
    static getCreationCost(level) {
        const baseCost = {
            gold: 15,
            wood: 5,
            food: 5,
            metal: 5
        };
        
        const multiplier = Math.max(1, level);
        const cost = {};
        
        for (const [resource, amount] of Object.entries(baseCost)) {
            cost[resource] = amount * multiplier;
        }
        
        return cost;
    }

    /**
     * Get JSON representation
     */
    toJSON() {
        return {
            nationId: this.nationId,
            x: this.x,
            y: this.y,
            innerX: this.innerX,
            innerY: this.innerY,
            level: this.level,
            health: this.health,
            experience: this.experience,
            movementPoints: this.movementPoints,
            orders: this.orders,
            target: this.target,
            victories: this.victories,
            defeats: this.defeats,
            battlesParticipated: this.battlesParticipated,
            createdTurn: this.createdTurn
        };
    }

    /**
     * Load from JSON representation
     */
    static fromJSON(data) {
        const army = new Army(
            data.nationId,
            data.x,
            data.y,
            data.innerX,
            data.innerY
        );
        
        army.level = data.level || 1;
        army.health = data.health || 100;
        army.experience = data.experience || 0;
        army.movementPoints = data.movementPoints || GAME_CONFIG.ARMY_MOVEMENT_POINTS;
        army.orders = data.orders || null;
        army.target = data.target || null;
        army.victories = data.victories || 0;
        army.defeats = data.defeats || 0;
        army.battlesParticipated = data.battlesParticipated || 0;
        army.createdTurn = data.createdTurn || 0;
        
        return army;
    }
}
