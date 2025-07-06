/**
 * Simple UI components for testing
 */

export class UIComponents {
    constructor() {
        this.gameContainer = null;
    }

    createGameContainer() {
        const container = document.createElement('div');
        container.id = 'gameContainer';
        container.className = 'crt-effect';
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            color: #00ff00;
            font-family: 'Courier New', monospace;
            padding: 20px;
        `;
        this.gameContainer = container;
        return container;
    }

    createHeader(seed) {
        const header = document.createElement('div');
        header.innerHTML = `
            <h1>ASCII Strategy Simulation (Refactored)</h1>
            <div>Seed: <span style="color: #ffff00">${seed}</span></div>
        `;
        return header;
    }

    createGameArea() {
        const area = document.createElement('div');
        area.style.cssText = 'display: flex; gap: 20px; margin: 20px 0;';
        return area;
    }

    createLeftSidebar() {
        const sidebar = document.createElement('div');
        sidebar.innerHTML = `
            <h3>Stats</h3>
            <div id="stats">Loading...</div>
        `;
        return sidebar;
    }

    createMapContainer() {
        const container = document.createElement('div');
        container.id = 'mapContainer';
        container.style.cssText = 'text-align: center;';
        return container;
    }

    createRightSidebar() {
        const sidebar = document.createElement('div');
        sidebar.innerHTML = `
            <h3>Game Log</h3>
            <div id="gameLog" style="height: 200px; overflow-y: auto; border: 1px solid #00ff00; padding: 10px;">
                Loading...
            </div>
        `;
        return sidebar;
    }

    createFooter() {
        const footer = document.createElement('div');
        footer.innerHTML = `
            <button onclick="window.app.game.nextTurn()">Next Turn</button>
            <button onclick="window.app.game.autoPlay()">Auto Play</button>
            <button onclick="window.app.game.pause()">Pause</button>
            <button onclick="window.app.game.reset()">Reset</button>
        `;
        return footer;
    }

    updateGameStats(game) {
        const statsEl = document.getElementById('stats');
        if (statsEl) {
            statsEl.innerHTML = `
                <div>Turn: ${game.turn}</div>
                <div>Nations: ${game.nations.length}</div>
                <div>Active: ${game.nations.filter(n => !n.isEliminated()).length}</div>
            `;
        }
    }

    updateGameLog(gameLog) {
        const logEl = document.getElementById('gameLog');
        if (logEl && gameLog.length > 0) {
            const recent = gameLog.slice(-10);
            logEl.innerHTML = recent.map(entry => 
                `<div>T${entry.turn}: ${entry.message}</div>`
            ).join('');
            logEl.scrollTop = logEl.scrollHeight;
        }
    }

    updateBattleLog() {
        // Update battle log
    }

    updateNationStats() {
        // Update nation stats
    }

    updateSeedDisplay() {
        // Update seed display
    }

    updateGameState() {
        // Update game state
    }

    clearHighlights() {
        // Clear highlights
    }

    showNotification(message, duration = 3000) {
        console.log('Notification:', message);
    }

    showDialog() {
        // Show dialog
    }

    handleResize() {
        // Handle resize
    }
}
