/**
 * Main entry point for ASCII Strategy Simulation
 */

import { Game } from './modules/Game.js';
import { Renderer } from './ui/Renderer.js';
import { EventHandlers } from './ui/EventHandlers.js';
import { UIComponents } from './ui/UIComponents.js';
import { getSeedFromURL } from './utils/RandomUtils.js';

class GameApplication {
    constructor() {
        this.game = null;
        this.renderer = null;
        this.eventHandlers = null;
        this.uiComponents = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            console.log('Initializing ASCII Strategy Simulation...');
            
            // Show loading state
            this.showLoading();
            
            // Get seed from URL or generate new one
            const seed = getSeedFromURL();
            
            // Initialize game
            this.game = new Game(seed);
            
            // Initialize UI components
            this.uiComponents = new UIComponents();
            this.uiComponents.setGame(this.game); // Set game reference for button handlers
            this.renderer = new Renderer(this.game);
            this.eventHandlers = new EventHandlers(this.game, this.renderer, this.uiComponents);
            
            // Setup UI
            await this.setupUI();
            
            // Setup event handlers
            this.setupEventHandlers();
            
            // Initial render
            this.render();
            
            // Force initial UI update
            this.uiComponents.updateGameStats(this.game);
            this.uiComponents.updateGameLog(this.game.gameLog);
            
            // Force initial map render
            console.log('Forcing initial map render...');
            this.renderer.render();
            
            // Hide loading state
            this.hideLoading();
            
            this.isInitialized = true;
            console.log('Game initialized successfully');
            
            // Display welcome message
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('Failed to initialize game: ' + error.message);
        }
    }

    /**
     * Setup the user interface
     */
    async setupUI() {
        // Create main game container
        const gameContainer = this.uiComponents.createGameContainer();
        document.body.appendChild(gameContainer);
        
        // Create header with title and seed display
        const header = this.uiComponents.createHeader(this.game.seed);
        gameContainer.appendChild(header);
        
        // Create main game area
        const gameArea = this.uiComponents.createGameArea();
        gameContainer.appendChild(gameArea);
        
        // Create left sidebar with stats and legend
        const leftSidebar = this.uiComponents.createLeftSidebar();
        gameArea.appendChild(leftSidebar);
        
        // Create center map area
        const mapContainer = this.uiComponents.createMapContainer();
        gameArea.appendChild(mapContainer);
        
        // Create right sidebar with logs and battles
        const rightSidebar = this.uiComponents.createRightSidebar();
        gameArea.appendChild(rightSidebar);
        
        // Create footer with controls
        const footer = this.uiComponents.createFooter();
        gameContainer.appendChild(footer);
        
        // Initialize canvas for map rendering
        this.renderer.initializeCanvas(mapContainer);
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Game controls
        this.eventHandlers.setupGameControls();
        
        // Map interactions
        this.eventHandlers.setupMapInteractions();
        
        // Keyboard shortcuts
        this.eventHandlers.setupKeyboardShortcuts();
        
        // Window events
        this.eventHandlers.setupWindowEvents();
        
        // Mobile support
        this.eventHandlers.setupMobileSupport();
    }

    /**
     * Main render loop
     */
    render() {
        if (!this.isInitialized) return;
        
        try {
            // Update UI components less frequently to avoid overwhelming
            if (!this.lastUIUpdate || Date.now() - this.lastUIUpdate > 100) {
                this.uiComponents.updateGameStats(this.game);
                this.uiComponents.updateGameLog(this.game.gameLog);
                this.lastUIUpdate = Date.now();
            }
            
            // Render map
            this.renderer.render();
            
            // Schedule next render
            requestAnimationFrame(() => this.render());
            
        } catch (error) {
            console.error('Render error:', error);
        }
    }

    /**
     * Handle game state changes
     */
    onGameStateChange() {
        if (!this.isInitialized) return;
        
        // Update UI based on current game state
        this.uiComponents.updateGameState(this.game);
        
        // Check for game end conditions
        const activeNations = this.game.nations.filter(n => !n.isEliminated());
        if (activeNations.length <= 1) {
            this.showGameEndDialog(activeNations);
        }
    }

    /**
     * Show game end dialog
     */
    showGameEndDialog(activeNations) {
        let message;
        if (activeNations.length === 1) {
            const winner = activeNations[0];
            message = `🎉 Victory! ${winner.name} has conquered the world! 🎉`;
        } else {
            message = '💀 All nations have fallen. The world lies in ruins. 💀';
        }
        
        this.uiComponents.showDialog({
            title: 'Game Over',
            message: message,
            buttons: [
                {
                    text: 'New Game',
                    action: () => this.newGame()
                },
                {
                    text: 'Export Results',
                    action: () => this.exportGameResults()
                }
            ]
        });
    }

    /**
     * Start a new game
     */
    newGame() {
        try {
            this.game.reset();
            this.uiComponents.clearHighlights();
            this.uiComponents.showNotification('New game started!');
        } catch (error) {
            console.error('Failed to start new game:', error);
            this.showError('Failed to start new game: ' + error.message);
        }
    }

    /**
     * Export game results
     */
    exportGameResults() {
        try {
            const gameState = this.game.exportGameState();
            const dataStr = JSON.stringify(gameState, null, 2);
            
            // Create download link
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `ascii-strategy-game-${this.game.seed}-turn-${this.game.turn}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            
            this.uiComponents.showNotification('Game results exported!');
            
        } catch (error) {
            console.error('Failed to export game results:', error);
            this.showError('Failed to export results: ' + error.message);
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        const loading = document.createElement('div');
        loading.id = 'loading';
        loading.className = 'loading-screen';
        loading.innerHTML = `
            <div class="loading-content">
                <h1>ASCII Strategy Simulation</h1>
                <div class="loading-spinner"></div>
                <p>Generating world...</p>
            </div>
        `;
        document.body.appendChild(loading);
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.remove();
        }
    }

    /**
     * Show welcome message
     */
    showWelcomeMessage() {
        this.uiComponents.showNotification(
            `Welcome to ASCII Strategy Simulation! Seed: ${this.game.seed}`,
            5000
        );
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error(message);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-screen';
        errorDiv.innerHTML = `
            <div class="error-content">
                <h2>⚠️ Error</h2>
                <p>${message}</p>
                <button onclick="location.reload()">Reload Game</button>
            </div>
        `;
        
        document.body.innerHTML = '';
        document.body.appendChild(errorDiv);
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        if (this.renderer) {
            this.renderer.handleResize();
        }
        
        if (this.uiComponents) {
            this.uiComponents.handleResize();
        }
    }

    /**
     * Handle visibility change (tab switching)
     */
    onVisibilityChange() {
        if (document.hidden && this.game && this.game.isPlaying) {
            // Pause auto-play when tab is hidden
            this.game.pause();
            this.uiComponents.showNotification('Game paused (tab not visible)');
        }
    }

    /**
     * Handle before unload (page close)
     */
    onBeforeUnload(event) {
        if (this.game && this.game.turn > 10) {
            const message = 'Are you sure you want to leave? Your game progress will be lost.';
            event.returnValue = message;
            return message;
        }
    }
}

// Global application instance
let app;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        app = new GameApplication();
        await app.initialize();
        
        // Setup global event listeners
        window.addEventListener('resize', () => app.onWindowResize());
        document.addEventListener('visibilitychange', () => app.onVisibilityChange());
        window.addEventListener('beforeunload', (e) => app.onBeforeUnload(e));
        
        // Expose app to global scope for debugging
        if (typeof window !== 'undefined') {
            window.game = app.game;
            window.app = app;
        }
        
    } catch (error) {
        console.error('Failed to start application:', error);
        
        // Show simple error message
        document.body.innerHTML = `
            <div style="
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                background: #000; 
                color: #ff0000; 
                font-family: 'Courier New', monospace;
                text-align: center;
            ">
                <div>
                    <h1>⚠️ Critical Error</h1>
                    <p>Failed to initialize ASCII Strategy Simulation</p>
                    <p>Error: ${error.message}</p>
                    <button onclick="location.reload()" style="
                        background: #003300; 
                        color: #00ff00; 
                        border: 1px solid #00ff00; 
                        padding: 10px 20px; 
                        margin-top: 20px; 
                        cursor: pointer;
                        font-family: inherit;
                    ">Reload</button>
                </div>
            </div>
        `;
    }
});

// Handle module loading errors
window.addEventListener('error', (event) => {
    if (event.filename && event.filename.includes('.js')) {
        console.error('Module loading error:', event.error);
        
        document.body.innerHTML = `
            <div style="
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                background: #000; 
                color: #ff0000; 
                font-family: 'Courier New', monospace;
                text-align: center;
            ">
                <div>
                    <h1>⚠️ Module Loading Error</h1>
                    <p>Failed to load game modules</p>
                    <p>Please ensure you're running the game from a web server</p>
                    <p>Error: ${event.error?.message || 'Unknown error'}</p>
                </div>
            </div>
        `;
    }
});

export { GameApplication };
