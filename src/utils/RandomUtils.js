/**
 * Seeded random number generation utilities
 */

export class SeededRandom {
    constructor(seed = null) {
        this.seed = seed || Math.floor(Math.random() * 1000000);
        this.x = Math.sin(this.seed) * 10000;
    }

    /**
     * Generate a random number between 0 and 1
     */
    random() {
        this.x = Math.sin(this.x) * 10000;
        return this.x - Math.floor(this.x);
    }

    /**
     * Generate a random integer between min and max (inclusive)
     */
    randomInt(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }

    /**
     * Generate a random float between min and max
     */
    randomFloat(min, max) {
        return this.random() * (max - min) + min;
    }

    /**
     * Choose a random element from an array
     */
    choice(array) {
        return array[Math.floor(this.random() * array.length)];
    }

    /**
     * Shuffle an array in place using Fisher-Yates algorithm
     */
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Generate a random boolean with given probability
     */
    probability(chance) {
        return this.random() < chance;
    }
}

export function getSeedFromURL() {
    const params = new URLSearchParams(window.location.search);
    const seed = parseInt(params.get('seed'));
    return seed > 0 ? seed : null;
}

export function updateURLWithSeed(seed) {
    const url = new URL(window.location);
    url.searchParams.set('seed', seed);
    window.history.replaceState({}, '', url);
}

/**
 * Generate a random integer between min and max (inclusive)
 * Uses standard Math.random() for simple use cases
 */
export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
