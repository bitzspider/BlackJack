class CardTest extends Phaser.Scene {
    constructor() {
        super({ key: 'CardTest' });
        this.cardWidth = 167;    // Correct frame width
        this.cardHeight = 220;   // Correct frame height
        this.currentFrame = 0;
        this.cardScale = 0.7;    // Initial scale (70% of original size)
    }

    preload() {
        // Initial load of the spritesheet
        this.load.spritesheet('cards', 
            'assets/cards/cards.png',
            { 
                frameWidth: this.cardWidth,
                frameHeight: this.cardHeight,
                spacing: 0,
                margin: 0
            }
        );
    }

    reloadSpritesheet(width, height) {
        return new Promise((resolve) => {
            // Remove existing texture
            if (this.textures.exists('cards')) {
                this.card.destroy();
                this.textures.remove('cards');
            }

            // Load new spritesheet
            this.load.spritesheet('cards', 
                'assets/cards/cards.png',
                { 
                    frameWidth: width,
                    frameHeight: height,
                    spacing: 0,
                    margin: 0
                }
            );

            // Wait for load to complete
            this.load.once('complete', () => {
                // Recreate card with new texture
                this.card = this.add.sprite(400, 300, 'cards', this.currentFrame);
                this.card.setScale(this.cardScale);  // Apply scale
                this.card.setInteractive();
                this.setupCardInteraction();
                resolve();
            });

            this.load.start();
        });
    }

    setupCardInteraction() {
        this.card.on('pointerdown', () => {
            this.currentFrame = (this.currentFrame + 1) % 52;
            this.card.setFrame(this.currentFrame);
            this.frameText.setText(`Frame: ${this.currentFrame}`);
        });
    }

    create() {
        // Add a dark background
        this.add.rectangle(400, 300, 800, 600, 0x1a1a1a);

        // Add title text
        this.add.text(400, 50, 'Card Test - Ace of Spades', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Create initial card sprite
        this.card = this.add.sprite(400, 300, 'cards', 0);
        this.card.setScale(this.cardScale);  // Apply initial scale
        this.card.setInteractive();
        this.setupCardInteraction();

        // Add frame number display
        this.frameText = this.add.text(400, 400, 'Frame: 0', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Add dimension controls
        const inputStyle = {
            fontSize: '16px',
            fill: '#ffffff'
        };

        // Width input
        this.add.text(200, 450, 'Width:', inputStyle).setOrigin(1, 0.5);
        const widthInput = document.createElement('input');
        widthInput.type = 'number';
        widthInput.value = this.cardWidth;
        widthInput.style = 'position: absolute; width: 60px;';
        document.body.appendChild(widthInput);
        
        // Height input
        this.add.text(400, 450, 'Height:', inputStyle).setOrigin(1, 0.5);
        const heightInput = document.createElement('input');
        heightInput.type = 'number';
        heightInput.value = this.cardHeight;
        heightInput.style = 'position: absolute; width: 60px;';
        document.body.appendChild(heightInput);

        // Scale input
        this.add.text(600, 450, 'Scale:', inputStyle).setOrigin(1, 0.5);
        const scaleInput = document.createElement('input');
        scaleInput.type = 'number';
        scaleInput.step = '0.1';
        scaleInput.value = this.cardScale;
        scaleInput.style = 'position: absolute; width: 60px;';
        document.body.appendChild(scaleInput);

        // Position the inputs
        const gameCanvas = this.sys.game.canvas;
        const canvasRect = gameCanvas.getBoundingClientRect();
        widthInput.style.left = (canvasRect.left + 210) + 'px';
        widthInput.style.top = (canvasRect.top + 440) + 'px';
        heightInput.style.left = (canvasRect.left + 410) + 'px';
        heightInput.style.top = (canvasRect.top + 440) + 'px';
        scaleInput.style.left = (canvasRect.left + 610) + 'px';
        scaleInput.style.top = (canvasRect.top + 440) + 'px';

        // Add update button with background
        const updateButton = this.add.rectangle(700, 450, 80, 30, 0x444444);
        const updateText = this.add.text(700, 450, 'Update', {
            fontSize: '16px',
            fill: '#ffffff'
        })
        .setOrigin(0.5)
        .setInteractive();

        // Make both button and text interactive
        updateButton.setInteractive();
        
        const updateHandler = async () => {
            const newWidth = parseInt(widthInput.value);
            const newHeight = parseInt(heightInput.value);
            const newScale = parseFloat(scaleInput.value);
            
            if (newWidth > 0 && newHeight > 0 && newScale > 0) {
                this.cardWidth = newWidth;
                this.cardHeight = newHeight;
                this.cardScale = newScale;
                
                // Wait for spritesheet to reload before updating UI
                await this.reloadSpritesheet(newWidth, newHeight);
                this.dimensionsText.setText(`Card Size: ${this.cardWidth}x${this.cardHeight} (Scale: ${this.cardScale})`);
            }
        };

        updateButton.on('pointerdown', updateHandler);
        updateText.on('pointerdown', updateHandler);

        // Add card dimensions display
        this.dimensionsText = this.add.text(400, 500, `Card Size: ${this.cardWidth}x${this.cardHeight} (Scale: ${this.cardScale})`, {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Add instructions
        this.add.text(400, 550, 'Click card to cycle through frames', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5);
    }
}

// Game configuration for the test
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: CardTest,
    backgroundColor: '#1a1a1a'
};

// Create the game instance
const game = new Phaser.Game(config); 