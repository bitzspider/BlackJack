﻿# Blackjack Game

A modern implementation of the classic Blackjack card game built with Phaser 3. This game features smooth animations, realistic card gameplay, and multiple betting options.


## Features

- 🎮 Classic Blackjack gameplay
- 💰 Betting system with chips
- 🎲 Multiple game actions:
  - Hit
  - Stand
  - Double Down
  - Split pairs
  - Surrender
- 🎯 Real-time score display
- 🎨 Smooth card animations
- 📱 Responsive design

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v12.0.0 or higher)
- npm (usually comes with Node.js)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/bitzspider/BlackJack.git
```

2. Navigate to the project directory:
```bash
cd BlackJack
```

3. Install dependencies:
```bash
npm install
```

## Running the Game

1. Start the development server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:8080
```

## How to Play

1. Place your bet by clicking on the chip values
2. Click 'Deal' to start the hand
3. Choose your action:
   - Hit: Take another card
   - Stand: Keep your current hand
   - Double Down: Double your bet and take one more card
   - Split: If you have a pair, split them into two hands
   - Surrender: Give up half your bet and end the hand

## Game Rules

- Dealer must hit on 16 and stand on 17
- Blackjack pays 3:2
- Double Down allowed on any first two cards
- Split allowed on pairs
- Surrender allowed on initial hand
- Maximum bet: 500 chips
- Minimum bet: 10 chips

## Technologies Used

- [Phaser 3](https://phaser.io/phaser3) - Game framework
- HTML5 Canvas
- JavaScript (ES6+)
- Node.js
- npm

## Development

To modify the game:
1. The main game logic is in `src/game.js`
2. Card assets are in the `assets` directory
3. Game configuration is at the bottom of `game.js`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Card assets from [Playing Cards Assets](https://github.com/hayeah/playing-cards-assets)
- Phaser 3 game framework
- The open-source community

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/bitzspider/BlackJack/issues).
