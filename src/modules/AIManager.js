/**
 * Simple AI manager for testing
 */

export class AIManager {
    constructor(random) {
        this.random = random;
        this.nations = null;
        this.map = null;
    }

    initialize(nations, map) {
        this.nations = nations;
        this.map = map;
    }

    makeDecisions(nation, map, turn) {
        // Simple AI decisions for testing
        if (this.random.probability(0.3) && nation.resources.gold > 50) {
            // Random development
            console.log(`${nation.name} is considering development...`);
        }
    }
}
