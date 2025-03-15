# 3D Gelatinous Gathering

A 3D reimagination of the classic Agar.io game with advanced rendering, multiplayer capabilities, and performance optimizations.

![3D Gelatinous Gathering](https://i.imgur.com/ZLUcDXL.png)

## 🎮 Features

- **Full 3D Environment**: Experience the classic blob-eating gameplay in a beautifully rendered 3D world
- **Optimized Performance**: Carefully tuned rendering engine with quality options for all hardware
- **Multiplayer Mode**: Compete with other players in real-time
- **Power-ups System**: Collect special items that grant temporary abilities
- **Modern Visuals**: Beautiful visual effects including bloom, ambient particles, and dynamic lighting
- **Responsive Controls**: Smooth keyboard and touch controls for mobile gameplay

## 🚀 Performance Optimizations

The game features extensive performance optimizations to ensure smooth gameplay on a variety of hardware:

- **Separated Game Systems**: Different game systems (camera, physics, AI, collisions) operate at independent update frequencies
- **Spatial Partitioning**: Optimized collision detection that only checks nearby objects
- **Dynamic Quality Settings**: Three quality modes to match your hardware capabilities
- **Frame-independent Physics**: Consistent gameplay experience regardless of framerate
- **Efficient Rendering**: Optimized 3D models and particle systems
- **Throttled Updates**: Server communications and AI calculations happen at appropriate intervals

## 🎛️ Quality Settings

| Setting | Description | Recommended For |
|---------|-------------|-----------------|
| **Low** | Disables all post-processing effects and visual enhancements for maximum FPS | Older PCs, laptops |
| **Medium** | Balanced visuals with moderate effects and optimized particle count | Mid-range hardware |
| **High** | Full visual experience with advanced lighting and effects | Gaming PCs, high-end GPUs |

## 📦 Installation

### Prerequisites
- Node.js (v14.0.0 or higher)
- NPM (v6.0.0 or higher)

### Setup
1. Clone the repository:
```bash
git clone https://github.com/WaffleBits/3d-gelatinous-gathering.git
cd 3d-gelatinous-gathering
```

2. Install dependencies:
```bash
npm install
```

## 🎯 How to Play

### Running the Game
Use the included batch file to start both the game and multiplayer servers:
```bash
./run-game.bat
```

Then open your browser to:
```
http://localhost:3000
```

### Controls

- **WASD** or **Arrow Keys**: Move your blob
- **Mouse**: Look around
- **Touch Screen**: Virtual joystick (mobile devices)

### Gameplay

1. Start as a small blob in a 3D world filled with food particles and other players
2. Consume food to grow in size
3. Larger blobs can consume smaller ones
4. Collect power-ups for temporary advantages:
   - **Shield**: Protects from being eaten
   - **Speed**: Temporary movement boost
   - **Ghost**: Pass through other players

## 🛠️ Technical Details

### Architecture
- **Next.js**: Frontend framework
- **Three.js & React Three Fiber**: 3D rendering
- **Socket.io**: Real-time multiplayer communication
- **Node.js**: Backend server

### Optimization Features
- Throttled update cycles
- Frame-independent movement
- Spatial partitioning for collision detection
- Dynamic level of detail
- Optimized particle systems
- Efficient component rendering

## 🎮 Development

### Available Scripts
- `npm run dev`: Start the development server
- `npm run build`: Build the production version
- `npm run start`: Start the production server
- `npm run server`: Start the multiplayer server

### File Structure
```
3d-gelatinous-gathering/
├── components/        # React components
│   ├── game/          # Game-specific components
│   │   ├── game.tsx               # Main game component
│   │   ├── game-scene.tsx         # 3D scene setup
│   │   ├── game-ui.tsx            # User interface
│   │   ├── player.tsx             # Player logic
│   │   ├── enemy.tsx              # Enemy logic
│   │   ├── food.tsx               # Food particles
│   │   ├── power-up.tsx           # Power-up items
│   │   └── visual-effects.tsx     # Post-processing and particles
├── lib/               # Shared utilities and stores
├── hooks/             # Custom React hooks
├── public/            # Static assets
├── server.js          # Multiplayer server
└── run-game.bat       # Launch script
```

## 👥 Credits

- Development: WaffleBits
- Performance optimization: @adnan 
- Original game concept: Agar.io

## 📜 License

MIT License 