const { createServer } = require("http")
const { Server } = require("socket.io")
const { v4: uuidv4 } = require("uuid")

// Create HTTP server and Socket.io server
const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: "*", // In production, restrict this to your domain
    methods: ["GET", "POST"],
  },
})

// Store active players
const players = new Map()

// Store food items (shared across all players)
const foods = Array.from({ length: 300 }, (_, i) => ({
  id: `food-${i}`,
  position: [Math.random() * 200 - 100, 0, Math.random() * 200 - 100],
  color: `hsl(${Math.random() * 360}, 70%, 60%)`,
}))

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`)

  // Send initial food data
  socket.emit("foods", foods)

  // Join game handler
  socket.on("join", ({ name, skinId }) => {
    const playerId = socket.id
    const playerColor = `hsl(${Math.random() * 360}, 70%, 60%)`

    // Create new player
    const player = {
      id: playerId,
      name: name || `Player ${playerId.substring(0, 5)}`,
      position: [Math.random() * 100 - 50, 0, Math.random() * 100 - 50],
      size: 1,
      score: 0,
      skinId: skinId || 0,
      color: playerColor,
    }

    // Add player to players map
    players.set(playerId, player)

    // Broadcast updated players list to all clients
    io.emit("players", Array.from(players.values()))
  })

  // Update player position handler
  socket.on("updatePosition", ({ position, size, score }) => {
    const player = players.get(socket.id)
    
    if (player) {
      player.position = position
      player.size = size
      player.score = score
      
      // Broadcast updated player to all clients
      io.emit("players", Array.from(players.values()))
    }
  })

  // Food eaten handler
  socket.on("foodEaten", (foodId) => {
    // Find the food index
    const foodIndex = foods.findIndex((food) => food.id === foodId)
    
    if (foodIndex !== -1) {
      // Replace the eaten food with a new one
      foods[foodIndex] = {
        id: `food-${Date.now()}`,
        position: [Math.random() * 200 - 100, 0, Math.random() * 200 - 100],
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      }
      
      // Broadcast updated foods to all clients
      io.emit("foods", foods)
    }
  })
  
  // Player died handler
  socket.on("playerDied", () => {
    // Remove player from active players
    players.delete(socket.id)
    
    // Broadcast updated players list to all clients
    io.emit("players", Array.from(players.values()))
  })

  // Disconnect handler
  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`)
    
    // Remove player from active players
    players.delete(socket.id)
    
    // Broadcast updated players list to all clients
    io.emit("players", Array.from(players.values()))
  })
})

// Start the server
const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`)
}) 