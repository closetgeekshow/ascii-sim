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
        container.className = 'game-container';
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            color: #00ff00;
            font-family: 'Courier New', monospace;
            padding: 10px;
            box-sizing: border-box;
            overflow-y: auto;
        `;
        this.gameContainer = container;
        return container;
    }

    createHeader(seed) {
        const header = document.createElement('div');
        header.style.cssText = `
            text-align: center;
            margin-bottom: 15px;
            padding: 10px;
            border-bottom: 1px solid #00ff00;
        `;
        
        const title = document.createElement('h1');
        title.textContent = 'ASCII Strategy Simulation';
        title.style.cssText = `
            margin: 0 0 10px 0;
            font-size: clamp(18px, 4vw, 24px);
            color: #00ff00;
        `;
        
        const seedDisplay = document.createElement('div');
        seedDisplay.style.cssText = 'font-size: 12px; color: #888;';
        seedDisplay.innerHTML = `Seed: <span id="currentSeed" style="color: #ffff00">${seed}</span>`;
        
        header.appendChild(title);
        header.appendChild(seedDisplay);
        return header;
    }

    createGameArea() {
        const area = document.createElement('div');
        area.className = 'game-area-responsive';
        area.style.cssText = `
            display: grid;
            gap: 15px;
            flex: 1;
        `;
        
        return area;
    }

    createLeftSidebar() {
        const sidebar = document.createElement('div');
        sidebar.style.cssText = `
            background: #001100;
            border: 1px solid #00ff00;
            padding: 10px;
            border-radius: 5px;
            height: fit-content;
        `;
        
        const title = document.createElement('h3');
        title.textContent = 'Game Stats';
        title.style.cssText = 'margin: 0 0 10px 0; font-size: 14px; color: #00ff00;';
        
        const stats = document.createElement('div');
        stats.id = 'stats';
        stats.style.cssText = 'font-size: 11px; line-height: 1.4;';
        stats.textContent = 'Loading...';
        
        sidebar.appendChild(title);
        sidebar.appendChild(stats);
        return sidebar;
    }

    createMapContainer() {
        const container = document.createElement('div');
        container.id = 'mapContainer';
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            background: #001100;
            border: 1px solid #00ff00;
            border-radius: 5px;
            padding: 15px;
            min-height: 300px;
        `;
        return container;
    }

    createRightSidebar() {
        const sidebar = document.createElement('div');
        sidebar.style.cssText = `
            background: #001100;
            border: 1px solid #00ff00;
            padding: 10px;
            border-radius: 5px;
            height: fit-content;
        `;
        
        const title = document.createElement('h3');
        title.textContent = 'Game Log';
        title.style.cssText = 'margin: 0 0 10px 0; font-size: 14px; color: #00ff00;';
        
        const log = document.createElement('div');
        log.id = 'gameLog';
        log.style.cssText = `
            height: 200px;
            overflow-y: auto;
            border: 1px solid #004400;
            padding: 8px;
            background: #000;
            font-size: 10px;
            line-height: 1.3;
        `;
        log.textContent = 'Loading...';
        
        sidebar.appendChild(title);
        sidebar.appendChild(log);
        return sidebar;
    }

    createFooter() {
        const footer = document.createElement('div');
        footer.className = 'button-container'; // Add class for CSS styling
        footer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin: 15px auto;
            padding: 15px;
            border-top: 1px solid #00ff00;
            width: 400px;
            max-width: 90vw;
            box-sizing: border-box;
        `;
        
        // Create buttons with proper event handlers
        const buttons = [
            { text: 'Next Turn', handler: () => this.handleNextTurn() },
            { text: 'Auto Play', handler: () => this.handleAutoPlay(), id: 'autoPlayBtn' },
            { text: 'Pause', handler: () => this.handlePause() },
            { text: 'Reset', handler: () => this.handleReset() }
        ];
        
        buttons.forEach(buttonConfig => {
            const btn = document.createElement('button');
            btn.textContent = buttonConfig.text;
            btn.onclick = buttonConfig.handler;
            if (buttonConfig.id) btn.id = buttonConfig.id;
            
            btn.style.cssText = `
                padding: 12px 8px;
                font-size: 12px;
                font-family: 'Courier New', monospace;
                background: #003300;
                color: #00ff00;
                border: 1px solid #00ff00;
                border-radius: 3px;
                cursor: pointer;
                transition: all 0.2s ease;
                min-height: 44px;
                white-space: nowrap;
                margin: 0;
                box-sizing: border-box;
            `;
            
            btn.onmouseover = () => {
                btn.style.backgroundColor = '#004400';
                btn.style.boxShadow = '0 0 5px #00ff00';
            };
            btn.onmouseout = () => {
                btn.style.backgroundColor = '#003300';
                btn.style.boxShadow = 'none';
            };
            
            footer.appendChild(btn);
        });
        
        return footer;
    }
    
    // Set the game reference for button handlers
    setGame(game) {
        this.game = game;
    }
    
    handleNextTurn() {
        if (this.game) {
            console.log('Processing turn...', this.game.turn);
            this.game.nextTurn();
            console.log('Turn processed, now:', this.game.turn);
            console.log('Game log entries:', this.game.gameLog.length);
            console.log('Nations:', this.game.nations.map(n => `${n.name}: ${n.totalTerritory} territory`));
            
            // Force immediate UI update
            this.updateGameStats(this.game);
            this.updateGameLog(this.game.gameLog);
            
            this.showNotification(`Turn ${this.game.turn} processed`);
        } else {
            console.error('No game instance available');
        }
    }
    
    handleAutoPlay() {
        if (this.game) {
            console.log('Auto-play clicked. Current playing state:', this.game.isPlaying);
            if (this.game.isPlaying) {
                this.game.pause();
                document.getElementById('autoPlayBtn').textContent = 'Auto Play';
                this.showNotification('Auto-play paused');
            } else {
                this.game.autoPlay();
                document.getElementById('autoPlayBtn').textContent = 'Pause Auto';
                this.showNotification('Auto-play started');
            }
        }
    }
    
    handlePause() {
        if (this.game) {
            this.game.pause();
            document.getElementById('autoPlayBtn').textContent = 'Auto Play';
            this.showNotification('Game paused');
        }
    }
    
    handleReset() {
        if (this.game && confirm('Are you sure you want to reset the game?')) {
            this.game.reset();
            document.getElementById('autoPlayBtn').textContent = 'Auto Play';
            this.showNotification('Game reset');
        }
    }

    updateGameStats(game) {
        const statsEl = document.getElementById('stats');
        if (statsEl && game && game.nations) {
            const activeNations = game.nations.filter(n => !n.isEliminated());
            const totalPop = game.nations.reduce((sum, n) => sum + n.totalPopulation, 0);
            const totalArmies = game.nations.reduce((sum, n) => sum + n.totalArmies, 0);
            
            statsEl.innerHTML = `
                <div style="margin-bottom: 8px;">
                    <strong>Turn:</strong> ${game.turn}<br>
                    <strong>Active Nations:</strong> ${activeNations.length}/${game.nations.length}
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>Total Population:</strong> ${totalPop.toLocaleString()}<br>
                    <strong>Total Armies:</strong> ${totalArmies}
                </div>
                <hr style="border: 1px solid #004400; margin: 8px 0;">
                ${game.nations.map(nation => `
                    <div style="margin-bottom: 6px; ${nation.isEliminated() ? 'opacity: 0.5;' : ''}">
                        <div style="color: ${nation.getColor()}; font-weight: bold;">
                            ${nation.symbol} ${nation.name}
                        </div>
                        <div style="font-size: 9px; margin-left: 10px;">
                            Territory: ${nation.totalTerritory} | 
                            Armies: ${nation.totalArmies} | 
                            Pop: ${nation.totalPopulation.toLocaleString()}
                        </div>
                        <div style="font-size: 9px; margin-left: 10px;">
                            Gold: ${nation.resources.gold} | 
                            Food: ${nation.resources.food} | 
                            Wood: ${nation.resources.wood} | 
                            Metal: ${nation.resources.metal}
                        </div>
                    </div>
                `).join('')}
            `;
        }
    }

    updateGameLog(gameLog) {
        const logEl = document.getElementById('gameLog');
        if (logEl && gameLog && gameLog.length > 0) {
            const recent = gameLog.slice(-20).reverse(); // Show most recent first
            logEl.innerHTML = recent.map(entry => {
                const message = typeof entry === 'string' ? entry : entry.message;
                const turn = typeof entry === 'object' && entry.turn ? entry.turn : '';
                return `<div style="margin-bottom: 4px; padding: 2px; border-left: 2px solid #004400; padding-left: 6px;">
                    ${turn ? `<span style="color: #ffff00;">[T${turn}]</span> ` : ''}${message}
                </div>`;
            }).join('');
            logEl.scrollTop = 0; // Keep newest at top
        } else if (logEl) {
            logEl.innerHTML = '<div style="color: #666;">No log entries yet...</div>';
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
        
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #003300;
            color: #00ff00;
            border: 1px solid #00ff00;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 9999;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            max-width: 300px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);
    }

    showDialog() {
        // Show dialog
    }

    handleResize() {
        // Handle resize
    }
}
