class BlackjackGame extends Phaser.Scene {
    constructor() {
        super({ key: 'BlackjackGame' });
        this.playerHand = [];
        this.dealerHand = [];
        this.splitHands = [];  // Array to hold split hands
        this.currentHandIndex = 0;  // Track which split hand is being played
        this.deck = [];
        this.playerMoney = 1000; // Starting money
        this.currentBet = 0;
        this.cardWidth = 167;    // Correct frame width
        this.cardHeight = 220;   // Correct frame height
        this.cardScale = 0.6;    // Scale cards to 70% of original size
        this.isDealing = false;
        this.canSurrender = false;  // Track if surrender is available
        
        // Card frame mapping for the sprite sheet
        // Each row has exactly 13 cards in sequence: A,2,3,4,5,6,7,8,9,10,J,Q,K
        this.suitMap = {
            'spades': 0,      // Row 0: frames 0-12
            'clubs': 13,      // Row 1: frames 13-25
            'diamonds': 26,   // Row 2: frames 26-38
            'hearts': 39      // Row 3: frames 39-51
        };
        
        // Values are sequential: A,2,3,4,5,6,7,8,9,10,J,Q,K
        this.valueMap = {
            'A': 0,
            '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8, '10': 9,
            'J': 10, 'Q': 11, 'K': 12
        };
    }

    preload() {
        // Debug logging for asset loading
        this.load.on('filecomplete', (key, type, data) => {
            console.log(`Asset loaded successfully: ${key}, type: ${type}`);
        });

        this.load.on('loaderror', (file) => {
            console.error('Error loading asset:', file.src);
            // Add visual error message to the game
            this.add.text(400, 100, `Error loading: ${file.key}`, {
                fontSize: '16px',
                fill: '#ff0000'
            }).setOrigin(0.5);
        });

        try {
            // Load card sprites - exactly 13 cards per row, 4 rows
            this.load.spritesheet('cards', 
                'assets/cards/cards.png',
                { 
                    frameWidth: this.cardWidth,    // Each card is exactly 167px wide
                    frameHeight: this.cardHeight,   // Each card is exactly 220px high
                    spacing: 0,         // No spacing between frames
                    margin: 0          // No margin around frames
                }
            );
            
            // Load cardback as a regular image
            this.load.image('cardback', 'assets/cards/cardback.png');

            // Add loading text
            this.loadingText = this.add.text(400, 300, 'Loading...', {
                fontSize: '24px',
                fill: '#ffffff'
            }).setOrigin(0.5);
        } catch (error) {
            console.error('Error in preload:', error);
        }
    }

    create() {
        try {
            // Debug logging for game creation
            console.log('Game scene created');
            
            if (this.loadingText) {
                this.loadingText.destroy();
            }

            // Set up the game table with a darker green felt color
            this.add.rectangle(400, 300, 900, 750, 0x00602f);
            
            // Add game title
            this.add.text(400, 50, 'BlackJack', {
                fontSize: '32px',
                fill: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            // Create the game UI and start the game
            this.createGameUI();
        } catch (error) {
            console.error('Error in create:', error);
            this.add.text(400, 300, 'Error creating game!', {
                fontSize: '24px',
                fill: '#ff0000'
            }).setOrigin(0.5);
        }
    }

    createGameUI() {
        // Add money display with better styling
        this.moneyText = this.add.text(50, 50, `Money: $${this.playerMoney}`, {
            fontSize: '24px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });

        // Add bet display
        this.betText = this.add.text(50, 90, `Current Bet: $${this.currentBet}`, {
            fontSize: '24px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });

        // Add helper text
        this.helperText = this.add.text(400, 300, 'Place your bet to begin', {
            fontSize: '32px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5);

        // Add betting buttons
        this.createBettingButtons();
        this.createGameButtons();

        // Initialize card positions
        this.initializeCardPositions();
        
        // Initialize the deck but don't deal cards yet
        this.createDeck();
        this.shuffleDeck();
    }

    initializeCardPositions() {
        // Use full card width for spacing
        const cardSpacing = Math.floor(this.cardWidth * this.cardScale * 1.1); // 110% of card width for some padding
        const startX = 200;     // Move starting position left to accommodate wider spacing
        
        this.playerCardPositions = [];
        this.dealerCardPositions = [];
        
        for (let i = 0; i < 5; i++) {
            this.playerCardPositions.push({
                x: startX + (i * cardSpacing),
                y: 400
            });
            this.dealerCardPositions.push({
                x: startX + (i * cardSpacing),
                y: 200
            });
        }
    }

    getCardFrame(card) {
        // Calculate the frame index based on suit and value
        // Each row has 13 cards, so multiply suit offset by 13 and add value offset
        const frame = (this.suitMap[card.suit] / 13) * 13 + this.valueMap[card.value];
        console.log(`Card: ${card.value} of ${card.suit}, Frame: ${frame}`);
        return frame;
    }

    createCardSprite(x, y, card, faceUp) {
        if (faceUp) {
            // Face-up cards use the spritesheet directly - no scaling needed
            const sprite = this.add.sprite(x, y, 'cards');
            const frame = this.getCardFrame(card);
            sprite.setFrame(frame);
            sprite.setScale(this.cardScale);  // Apply scaling to all cards
            return sprite;
        } else {
            // ONLY scale the cardback to match regular card size
            const sprite = this.add.sprite(x, y, 'cardback');
            sprite.setDisplaySize(this.cardWidth * this.cardScale, this.cardHeight * this.cardScale);
            return sprite;
        }
    }

    async dealCard(hand, position, faceUp) {
        return new Promise(resolve => {
            const card = this.deck.pop();
            hand.push(card);

            // Starting position (deck position)
            const startX = 700;
            const startY = 100;
            
            const targetPos = hand === this.playerHand 
                ? this.playerCardPositions[position]
                : this.dealerCardPositions[position];

            // Create the card sprite using our new function
            const cardObject = this.createCardSprite(startX, startY, card, faceUp);
            card.sprite = cardObject;

            // Add a slight rotation for more natural dealing
            const startAngle = Phaser.Math.Between(-10, 10);
            cardObject.setAngle(startAngle);

            // Create the dealing animation
            this.tweens.add({
                targets: cardObject,
                x: targetPos.x,
                y: targetPos.y,
                angle: 0,
                duration: 400,
                ease: 'Back.easeOut',
                onComplete: resolve
            });
        });
    }

    createBettingButtons() {
        const betAmounts = [10, 25, 50, 100];
        let startX = 250;

        betAmounts.forEach((amount, index) => {
            const button = this.add.text(startX + (index * 100), 500, `$${amount}`, {
                fontSize: '24px',
                fill: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 10, y: 5 }
            })
            .setInteractive()
            .on('pointerdown', () => this.placeBet(amount));

            button.setOrigin(0.5);
        });

        // Add Deal button (initially disabled)
        this.dealButton = this.add.text(650, 500, 'DEAL', {
            fontSize: '24px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        })
        .on('pointerdown', () => this.startNewHand())
        .setOrigin(0.5);

        // Start with Deal button disabled
        this.dealButton.disableInteractive();
    }

    createGameButtons() {
        // Create container for game buttons
        this.gameButtons = {};

        // Common button style
        const buttonStyle = {
            fontSize: '24px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        };

        // Top row - Hit and Stand buttons
        this.gameButtons.hit = this.add.text(325, 550, 'Hit', buttonStyle)
        .setInteractive()
        .on('pointerdown', () => this.handleHit())
        .setOrigin(0.5)
        .setVisible(false);

        this.gameButtons.stand = this.add.text(475, 550, 'Stand', buttonStyle)
        .setInteractive()
        .on('pointerdown', () => this.handleStand())
        .setOrigin(0.5)
        .setVisible(false);

        // Bottom row - special action buttons (more spread out)
        this.gameButtons.doubleDown = this.add.text(250, 590, 'Double', buttonStyle)
        .setInteractive()
        .on('pointerdown', () => this.handleDoubleDown())
        .setOrigin(0.5)
        .setVisible(false);

        this.gameButtons.split = this.add.text(400, 590, 'Split', buttonStyle)
        .setInteractive()
        .on('pointerdown', () => this.handleSplit())
        .setOrigin(0.5)
        .setVisible(false);

        this.gameButtons.surrender = this.add.text(550, 590, 'Surrender', buttonStyle)
        .setInteractive()
        .on('pointerdown', () => this.handleSurrender())
        .setOrigin(0.5)
        .setVisible(false);
    }

    placeBet(amount) {
        if (this.playerMoney >= amount && !this.isDealing) {
            this.currentBet += amount;
            this.playerMoney -= amount;
            this.updateMoneyDisplay();
            
            // Enable the Deal button when a bet is placed
            this.dealButton.setInteractive();
            
            // Update helper text when bet is placed
            if (this.helperText) {
                this.helperText.setText('Press DEAL to start');
            }
        }
    }

    updateMoneyDisplay() {
        this.moneyText.setText(`Money: $${this.playerMoney}`);
        this.betText.setText(`Current Bet: $${this.currentBet}`);
    }

    startNewHand() {
        if (this.currentBet > 0 && !this.isDealing) {
            this.isDealing = true;
            
            // Remove the helper text with a fade out
            if (this.helperText) {
                this.tweens.add({
                    targets: this.helperText,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => {
                        this.helperText.destroy();
                        this.helperText = null;
                    }
                });
            }

            this.clearTable();
            this.dealButton.disableInteractive();
            this.dealInitialCards();
        }
    }

    clearTable() {
        // Remove all card sprites with a fade out effect
        this.playerHand.forEach(card => {
            if (card.sprite) {
                this.tweens.add({
                    targets: card.sprite,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => card.sprite.destroy()
                });
            }
        });
        
        this.dealerHand.forEach(card => {
            if (card.sprite) {
                this.tweens.add({
                    targets: card.sprite,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => card.sprite.destroy()
                });
            }
        });
        
        // Clear hands
        this.playerHand = [];
        this.dealerHand = [];
        
        // Clear any message texts with fade
        if (this.messageText) {
            this.tweens.add({
                targets: this.messageText,
                alpha: 0,
                duration: 200,
                onComplete: () => {
                    this.messageText.destroy();
                    this.messageText = null;
                }
            });
        }

        // Clear hand value texts
        if (this.valueTexts) {
            this.valueTexts.forEach(text => {
                if (text) {
                    this.tweens.add({
                        targets: text,
                        alpha: 0,
                        duration: 200,
                        onComplete: () => text.destroy()
                    });
                }
            });
            this.valueTexts = null;
        }
    }

    initializeGame() {
        this.createDeck();
        this.shuffleDeck();
        this.dealInitialCards();
    }

    createDeck() {
        const suits = ['spades', 'clubs', 'diamonds', 'hearts'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        this.deck = [];
        for (let suit of suits) {
            for (let value of values) {
                this.deck.push({
                    suit,
                    value
                });
            }
        }
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    async dealInitialCards() {
        // Deal cards with animation
        await this.dealCard(this.playerHand, 0, true);
        await this.dealCard(this.dealerHand, 0, false);
        await this.dealCard(this.playerHand, 1, true);
        await this.dealCard(this.dealerHand, 1, true);

        // Set initial game state
        this.isDealing = false;
        this.canSurrender = true;  // Can only surrender on initial hand

        // Show initial hand values (true indicates initial deal)
        this.showHandValues(this.calculateHandValue(this.playerHand), null, true);

        // Check for natural blackjack
        if (this.calculateHandValue(this.playerHand) === 21) {
            this.handleBlackjack();
            return;
        }

        // Enable appropriate game buttons after initial deal
        this.updateGameButtons();
    }

    calculateHandValue(hand) {
        let value = 0;
        let aces = 0;

        for (let card of hand) {
            if (card.value === 'A') {
                aces += 1;
            } else if (['K', 'Q', 'J'].includes(card.value)) {
                value += 10;
            } else {
                value += parseInt(card.value);
            }
        }

        // Add aces last for optimal value
        for (let i = 0; i < aces; i++) {
            if (value + 11 <= 21) {
                value += 11;
            } else {
                value += 1;
            }
        }

        return value;
    }

    updateGameButtons() {
        // First hide all buttons
        Object.values(this.gameButtons).forEach(button => {
            button.setVisible(false);
        });

        // If we're not in the middle of an action
        if (!this.isDealing) {
            const hand = this.splitHands.length > 0 ? 
                this.splitHands[this.currentHandIndex] : 
                this.playerHand;

            // Enable basic actions if hand value is under 21
            const handValue = this.calculateHandValue(hand);
            
            // Always show Hit and Stand for active hand under 21
            if (handValue < 21) {
                this.gameButtons.hit.setVisible(true).setInteractive();
                this.gameButtons.stand.setVisible(true).setInteractive();

                // Only show special buttons on initial two cards
                if (hand.length === 2) {
                    // Double Down - only on initial two cards with enough money
                    if (this.playerMoney >= this.currentBet) {
                        this.gameButtons.doubleDown.setVisible(true).setInteractive();
                    }

                    // Split - only on pairs with enough money
                    if (this.canSplit() && this.playerMoney >= this.currentBet) {
                        this.gameButtons.split.setVisible(true).setInteractive();
                    }

                    // Surrender - only on initial hand (no splits)
                    if (this.canSurrender && this.playerHand.length === 2 && this.splitHands.length === 0) {
                        this.gameButtons.surrender.setVisible(true).setInteractive();
                    }
                }
            }
        }
    }

    disableGameButtons() {
        Object.values(this.gameButtons).forEach(button => {
            button.setVisible(false);
        });
    }

    enableGameButtons() {
        this.updateGameButtons();
    }

    canSplit() {
        const hand = this.splitHands.length > 0 ? 
            this.splitHands[this.currentHandIndex] : 
            this.playerHand;

        return hand.length === 2 && 
               this.getCardValue(hand[0]) === this.getCardValue(hand[1]) &&
               this.splitHands.length < 3;  // Limit to 3 splits (4 hands total)
    }

    getCardValue(card) {
        if (['J', 'Q', 'K'].includes(card.value)) return 10;
        if (card.value === 'A') return 11;
        return parseInt(card.value);
    }

    async handleDoubleDown() {
        this.disableGameButtons();
        
        // Double the bet
        this.playerMoney -= this.currentBet;
        this.currentBet *= 2;
        this.updateMoneyDisplay();

        // Deal exactly one card
        await this.dealCard(this.playerHand, this.playerHand.length, true);
        
        // Automatically stand
        await this.handleStand();
    }

    async handleSplit() {
        this.disableGameButtons();
        
        // Create new split hand
        const hand = this.splitHands.length > 0 ? 
            this.splitHands[this.currentHandIndex] : 
            this.playerHand;

        // Take second card to create new hand
        const card2 = hand.pop();
        const newHand = [card2];
        
        // Remove the sprite of the second card
        if (card2.sprite) {
            card2.sprite.destroy();
        }

        // Add to split hands if this is the first split
        if (this.splitHands.length === 0) {
            this.splitHands.push(hand);  // Add original hand
        }
        this.splitHands.push(newHand);  // Add new hand

        // Place additional bet
        this.playerMoney -= this.currentBet;
        this.updateMoneyDisplay();

        // Deal a card to each hand
        await this.dealCard(this.splitHands[this.splitHands.length - 2], 1, true);
        await this.dealCard(this.splitHands[this.splitHands.length - 1], 1, true);

        // Continue with first hand
        this.currentHandIndex = this.splitHands.length - 2;
        this.updateGameButtons();
    }

    handleSurrender() {
        this.disableGameButtons();
        
        // Return half the bet
        this.playerMoney += Math.floor(this.currentBet / 2);
        this.currentBet = 0;
        this.updateMoneyDisplay();

        // Show surrender message
        this.messageText = this.add.text(400, 300, 'Surrendered!', {
            fontSize: '48px',
            fill: '#888888',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Enable deal button for next hand
        this.dealButton.setInteractive();
    }

    async handleStand() {
        this.disableGameButtons();
        
        if (this.splitHands.length > 0) {
            // If there are more split hands to play
            if (this.currentHandIndex < this.splitHands.length - 1) {
                this.currentHandIndex++;
                this.updateGameButtons();
                return;
            }
        }
        
        // If all hands are complete, dealer plays
        await this.dealerPlay();
    }

    async handleHit() {
        this.disableGameButtons();
        this.canSurrender = false;  // Can't surrender after hitting
        
        const hand = this.splitHands.length > 0 ? 
            this.splitHands[this.currentHandIndex] : 
            this.playerHand;

        await this.dealCard(hand, hand.length, true);
        
        const handValue = this.calculateHandValue(hand);
        
        // Update the hand values display (true for initial means show dealer's partial value)
        this.showHandValues(handValue, null, true);
        
        if (handValue > 21) {
            if (this.splitHands.length > 0) {
                // If playing split hands, move to next hand or end game
                if (this.currentHandIndex < this.splitHands.length - 1) {
                    this.currentHandIndex++;
                    this.updateGameButtons();
                } else {
                    await this.dealerPlay();
                }
            } else {
                this.handleBust();
            }
        } else if (hand.length < 5) {
            this.updateGameButtons();
        }
    }

    async dealerPlay() {
        // Flip the dealer's hidden card
        const hiddenCard = this.dealerHand[0];
        if (hiddenCard.sprite) {
            // Destroy the old cardback sprite
            hiddenCard.sprite.destroy();
            // Create a new face-up card sprite with correct scaling
            hiddenCard.sprite = this.createCardSprite(
                this.dealerCardPositions[0].x,
                this.dealerCardPositions[0].y,
                hiddenCard,
                true
            );
        }

        // Show full dealer value now that card is revealed
        this.showHandValues(
            this.calculateHandValue(this.playerHand),
            this.calculateHandValue(this.dealerHand),
            false
        );

        // Add delay for dramatic effect
        await new Promise(resolve => setTimeout(resolve, 500));

        while (this.calculateHandValue(this.dealerHand) < 17) {
            await this.dealCard(this.dealerHand, this.dealerHand.length, true);
            // Update dealer's value after each card
            this.showHandValues(
                this.calculateHandValue(this.playerHand),
                this.calculateHandValue(this.dealerHand),
                false
            );
            // Add slight delay between dealer cards
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        this.determineWinner();
    }

    handleBlackjack() {
        this.disableGameButtons();
        this.messageText = this.add.text(400, 300, 'Blackjack!', {
            fontSize: '48px',
            fill: '#ffd700',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Add a scale animation
        this.tweens.add({
            targets: this.messageText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            yoyo: true,
            repeat: 1
        });

        this.playerMoney += Math.floor(this.currentBet * 2.5);
        this.currentBet = 0;
        this.updateMoneyDisplay();
        this.dealButton.setInteractive();
    }

    handleBust() {
        this.disableGameButtons();
        this.messageText = this.add.text(400, 300, 'Bust!', {
            fontSize: '48px',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Add a shake animation
        this.tweens.add({
            targets: this.messageText,
            x: 400 + 10,
            duration: 50,
            yoyo: true,
            repeat: 3
        });

        this.currentBet = 0;
        this.updateMoneyDisplay();
        this.dealButton.setInteractive();
    }

    determineWinner() {
        const dealerValue = this.calculateHandValue(this.dealerHand);
        let message = '';
        let color = '#ffffff';
        let totalWinnings = 0;

        // Function to evaluate a hand against the dealer
        const evaluateHand = (hand) => {
            const handValue = this.calculateHandValue(hand);
            if (handValue > 21) return 0;  // Bust
            if (dealerValue > 21) return 2;  // Dealer bust
            if (handValue > dealerValue) return 2;  // Win
            if (handValue === dealerValue) return 1;  // Push
            return 0;  // Lose
        };

        if (this.splitHands.length > 0) {
            // Evaluate each split hand
            this.splitHands.forEach((hand, index) => {
                const multiplier = evaluateHand(hand);
                totalWinnings += this.currentBet * multiplier;
            });
            
            if (totalWinnings > 0) {
                message = `You won $${totalWinnings}!`;
                color = '#00ff00';
            } else {
                message = 'Dealer Wins All Hands!';
                color = '#ff0000';
            }
        } else {
            // Single hand evaluation
            const playerValue = this.calculateHandValue(this.playerHand);
            const multiplier = evaluateHand(this.playerHand);
            totalWinnings = this.currentBet * multiplier;

            if (dealerValue > 21) {
                message = 'Dealer Busts! You Win!';
                color = '#00ff00';
            } else if (playerValue > dealerValue) {
                message = 'You Win!';
                color = '#00ff00';
            } else if (dealerValue > playerValue) {
                message = 'Dealer Wins!';
                color = '#ff0000';
            } else {
                message = 'Push!';
                color = '#ffffff';
            }
        }

        // Add winnings to player money
        this.playerMoney += totalWinnings;

        // Create winner message with animation
        this.messageText = this.add.text(400, 300, message, {
            fontSize: '48px',
            fill: color,
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0);

        // Fade in and scale animation
        this.tweens.add({
            targets: this.messageText,
            alpha: 1,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 500,
            ease: 'Back.easeOut',
            yoyo: true,
            repeat: 0,
            onComplete: () => {
                // After showing the result, show the helper text for the next round
                this.helperText = this.add.text(400, 300, 'Place your bet to begin', {
                    fontSize: '32px',
                    fill: '#ffffff',
                    backgroundColor: '#000000',
                    padding: { x: 15, y: 8 }
                }).setOrigin(0.5).setAlpha(0);

                // Fade in the helper text
                this.tweens.add({
                    targets: this.helperText,
                    alpha: 1,
                    duration: 200,
                    delay: 1000 // Delay the helper text appearance
                });
            }
        });

        // Show final hand values
        this.showHandValues(this.calculateHandValue(this.playerHand), dealerValue);

        // Reset for next hand
        this.currentBet = 0;
        this.splitHands = [];
        this.currentHandIndex = 0;
        this.updateMoneyDisplay();
        this.dealButton.setInteractive();
    }

    showHandValues(playerValue, dealerValue, isInitial = false) {
        // Clear any existing value texts first
        if (this.valueTexts) {
            this.valueTexts.forEach(text => {
                if (text) text.destroy();
            });
        }

        const valueStyle = {
            fontSize: '24px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        };

        // For dealer's value, if it's initial deal, only show visible card value
        let dealerDisplayValue;
        if (isInitial) {
            // Get value of dealer's visible card (second card)
            const visibleCard = this.dealerHand[1];
            let visibleValue = this.getCardValue(visibleCard);
            dealerDisplayValue = `Dealer: ${visibleValue}+`;
        } else {
            dealerDisplayValue = `Dealer: ${dealerValue}`;
        }

        const dealerValueText = this.add.text(625, 200, dealerDisplayValue, valueStyle);
        const playerValueText = this.add.text(625, 400, `Player: ${playerValue}`, valueStyle);

        // Store these texts so they can be cleared with the table
        this.valueTexts = [dealerValueText, playerValueText];
    }
}

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 675,
    scene: BlackjackGame,
    backgroundColor: '#1a1a1a'
};

// Create the game instance
const game = new Phaser.Game(config); 