import React, { useState, useEffect } from "react";
import io from "socket.io-client";

// Simple Button Component (inline to avoid import issues)
const Button = ({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  className = "",
  ...props
}) => {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    warning: "bg-yellow-600 hover:bg-yellow-700 text-white",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`font-bold py-2 px-4 rounded transition duration-200 focus:outline-none ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Simple Lobby Component (inline)
const Lobby = ({
  roomCode,
  players,
  currentPlayer,
  isHost,
  onStartGame,
  onBackToMenu,
}) => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Game Lobby</h1>
          <div className="text-xl text-blue-400 font-mono">
            Room Code:{" "}
            <span className="bg-gray-700 px-3 py-1 rounded">{roomCode}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              Players ({players.length})
            </h2>
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="bg-gray-700 p-3 rounded-lg flex items-center justify-between"
                >
                  <span className="text-white font-medium">{player.name}</span>
                  {player.id === currentPlayer?.id && (
                    <span className="text-blue-400 text-sm">You</span>
                  )}
                  {isHost && player.id === currentPlayer?.id && (
                    <span className="text-yellow-400 text-xs ml-2">HOST</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Game Rules</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Crewmates: Complete tasks and find impostors</li>
                <li>• Impostors: Eliminate crewmates without being caught</li>
                <li>• Use WASD or arrow keys to move</li>
                <li>• Report dead bodies to call meetings</li>
                <li>• Vote to eject suspected impostors</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          {isHost && (
            <Button
              onClick={onStartGame}
              disabled={players.length < 2}
              variant="success"
              className="flex-1"
            >
              {players.length >= 2
                ? "Start Game"
                : `Need ${2 - players.length} more player${
                    players.length === 1 ? "" : "s"
                  }`}
            </Button>
          )}

          <Button onClick={onBackToMenu} variant="danger" className="flex-1">
            Leave Room
          </Button>
        </div>

        {!isHost && (
          <div className="mt-4 text-center text-gray-400">
            Waiting for host to start the game...
          </div>
        )}
      </div>
    </div>
  );
};

// Game Constants
const GAME_STATES = {
  MENU: "menu",
  LOBBY: "lobby",
  PLAYING: "playing",
  MEETING: "meeting",
  ENDED: "ended",
};

const TASK_LOCATIONS = [
  { id: 1, name: "Fix Wiring", x: 150, y: 150 },
  { id: 2, name: "Empty Trash", x: 650, y: 200 },
  { id: 3, name: "Fuel Engine", x: 500, y: 450 },
  { id: 4, name: "Calibrate Distributor", x: 300, y: 400 },
  { id: 5, name: "Scan Boarding Pass", x: 600, y: 350 },
];

function App() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState(GAME_STATES.MENU);
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [inputName, setInputName] = useState("");
  const [inputRoomCode, setInputRoomCode] = useState("");
  const [error, setError] = useState("");
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [position, setPosition] = useState({ x: 400, y: 300 });
  const [keys, setKeys] = useState({});

  useEffect(() => {
    const newSocket = io("http://localhost:3001", {
      timeout: 5000,
    });

    newSocket.on("connect", () => {
      console.log("Connected to server:", newSocket.id);
      setIsConnected(true);
      setError("");
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setError(
        "Failed to connect to server. Please check if the backend is running on port 3001."
      );
    });

    // Room events
    newSocket.on("room-created", ({ roomCode, isHost }) => {
      console.log("Room created:", roomCode);
      setRoomCode(roomCode);
      setIsHost(isHost);
      setGameState(GAME_STATES.LOBBY);
      setError("");
    });

    newSocket.on("room-joined", ({ roomCode, players, isHost }) => {
      console.log("Room joined:", roomCode, "Players:", players.length);
      setRoomCode(roomCode);
      setPlayers(players);
      setIsHost(isHost);
      setGameState(GAME_STATES.LOBBY);
      setError("");

      const player = players.find((p) => p.id === newSocket.id);
      setCurrentPlayer(player);
    });

    newSocket.on("player-joined", ({ players }) => {
      console.log("Player joined, total players:", players.length);
      setPlayers(players);
    });

    newSocket.on("game-started", ({ role, players, gameState }) => {
      console.log("🎮 Game started! Role:", role, "Players:", players.length);
      setPlayers(players);
      setGameState(GAME_STATES.PLAYING);

      const player = players.find((p) => p.id === newSocket.id);
      setCurrentPlayer({ ...player, role, tasksCompleted: 0 });
      console.log("Current player:", { ...player, role });
    });

    newSocket.on("player-moved", ({ playerId, position }) => {
      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, position } : p))
      );
    });

    newSocket.on("task-completed", ({ tasksCompleted }) => {
      console.log("✅ Task completed! Total:", tasksCompleted);
      setCurrentPlayer((prev) => ({ ...prev, tasksCompleted }));
    });

    newSocket.on("player-killed", ({ killedPlayer, body }) => {
      console.log("💀 Player killed:", killedPlayer);
      setPlayers((prev) =>
        prev.map((p) => (p.id === killedPlayer ? { ...p, state: "dead" } : p))
      );
    });

    newSocket.on("game-ended", (result) => {
      console.log("🏁 Game ended:", result);
      alert(
        `Game Over! ${
          result.winner === "crewmates"
            ? "🚀 Crewmates Win!"
            : "🔪 Impostors Win!"
        }\nReason: ${result.reason}`
      );
      setGameState(GAME_STATES.MENU);
    });

    newSocket.on("error", ({ message }) => {
      console.error("Socket error:", message);
      setError(message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Movement handling for game
  useEffect(() => {
    if (gameState !== GAME_STATES.PLAYING) return;

    const handleKeyDown = (e) => {
      setKeys((prev) => ({ ...prev, [e.key.toLowerCase()]: true }));
    };

    const handleKeyUp = (e) => {
      setKeys((prev) => ({ ...prev, [e.key.toLowerCase()]: false }));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  // Movement logic
  useEffect(() => {
    if (gameState !== GAME_STATES.PLAYING || !currentPlayer) return;

    const movePlayer = () => {
      let newX = position.x;
      let newY = position.y;
      const speed = 3;

      if (keys["w"] || keys["arrowup"]) newY -= speed;
      if (keys["s"] || keys["arrowdown"]) newY += speed;
      if (keys["a"] || keys["arrowleft"]) newX -= speed;
      if (keys["d"] || keys["arrowright"]) newX += speed;

      newX = Math.max(20, Math.min(780, newX));
      newY = Math.max(20, Math.min(580, newY));

      if (newX !== position.x || newY !== position.y) {
        const newPosition = { x: newX, y: newY };
        setPosition(newPosition);
        socket.emit("player-move", newPosition);
      }
    };

    const interval = setInterval(movePlayer, 16);
    return () => clearInterval(interval);
  }, [keys, position, socket, gameState, currentPlayer]);

  const handleCreateRoom = () => {
    if (!inputName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!isConnected) {
      setError("Not connected to server");
      return;
    }

    setPlayerName(inputName.trim());
    socket.emit("create-room", inputName.trim());
  };

  const handleJoinRoom = () => {
    if (!inputName.trim() || !inputRoomCode.trim()) {
      setError("Please enter your name and room code");
      return;
    }
    if (!isConnected) {
      setError("Not connected to server");
      return;
    }

    setPlayerName(inputName.trim());
    socket.emit("join-room", {
      roomCode: inputRoomCode.trim().toUpperCase(),
      playerName: inputName.trim(),
    });
  };

  const handleStartGame = () => {
    console.log("Starting game...");
    socket.emit("start-game");
  };

  const handleBackToMenu = () => {
    setGameState(GAME_STATES.MENU);
    setRoomCode("");
    setPlayers([]);
    setCurrentPlayer(null);
    setError("");
    setIsHost(false);
    setInputName("");
    setInputRoomCode("");
    setPosition({ x: 400, y: 300 });
  };

  // Connection status screen
  if (!isConnected && !error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-white text-xl mb-2">Connecting to server...</h2>
          <p className="text-gray-400">
            Please wait while we establish connection
          </p>
        </div>
      </div>
    );
  }

  // Menu screen
  if (gameState === GAME_STATES.MENU) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
          <h1 className="text-4xl font-bold text-center text-white mb-8">
            Among Us MVP
          </h1>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter your name"
              value={inputName}
              onChange={(e) => {
                setInputName(e.target.value);
                setError("");
              }}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              maxLength={20}
            />

            <Button
              onClick={handleCreateRoom}
              disabled={!inputName.trim() || !isConnected}
              variant="success"
              className="w-full"
            >
              Create Room
            </Button>

            <div className="text-center text-gray-400">or</div>

            <input
              type="text"
              placeholder="Room Code"
              value={inputRoomCode}
              onChange={(e) => {
                setInputRoomCode(e.target.value.toUpperCase());
                setError("");
              }}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-center"
              maxLength={6}
            />

            <Button
              onClick={handleJoinRoom}
              disabled={
                !inputName.trim() || !inputRoomCode.trim() || !isConnected
              }
              variant="primary"
              className="w-full"
            >
              Join Room
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-600 text-white rounded text-center">
              {error}
            </div>
          )}

          {!isConnected && (
            <div className="mt-4 p-3 bg-yellow-600 text-white rounded text-center">
              ⚠️ Disconnected from server
            </div>
          )}
        </div>
      </div>
    );
  }

  // Lobby screen
  if (gameState === GAME_STATES.LOBBY) {
    return (
      <Lobby
        roomCode={roomCode}
        players={players}
        currentPlayer={currentPlayer}
        isHost={isHost}
        onStartGame={handleStartGame}
        onBackToMenu={handleBackToMenu}
      />
    );
  }

  // Game screen
  if (gameState === GAME_STATES.PLAYING) {
    if (!currentPlayer) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
          Loading game...
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-800 relative overflow-hidden">
        {/* Game UI Header */}
        <div className="absolute top-0 left-0 right-0 bg-gray-900 bg-opacity-95 p-4 flex justify-between items-center z-20">
          <div className="text-white">
            <span className="font-bold text-lg">{currentPlayer.name}</span>
            <span
              className={`ml-2 font-semibold ${
                currentPlayer.role === "impostor"
                  ? "text-red-400"
                  : "text-blue-400"
              }`}
            >
              {currentPlayer.role === "impostor"
                ? "🔪 IMPOSTOR"
                : "🔧 CREWMATE"}
            </span>
          </div>

          <div className="text-center">
            <div className="text-lg font-bold text-green-400">👤 ALIVE</div>
          </div>

          <Button onClick={handleBackToMenu} variant="danger">
            Leave Game
          </Button>
        </div>

        {/* Game Board */}
        <div className="relative w-full h-screen bg-gray-700 pt-20">
          {/* Task locations */}
          {TASK_LOCATIONS.map((task) => {
            const distance = Math.sqrt(
              Math.pow(task.x - position.x, 2) +
                Math.pow(task.y - position.y, 2)
            );
            const canInteract = distance <= 40;

            return (
              <div
                key={task.id}
                className={`absolute w-8 h-8 rounded border-2 transition-all duration-200 ${
                  canInteract
                    ? "bg-yellow-400 border-yellow-300 animate-pulse scale-110"
                    : "bg-gray-500 border-gray-400"
                }`}
                style={{
                  left: task.x - 16,
                  top: task.y - 16,
                }}
                title={task.name}
              >
                ⚙️
              </div>
            );
          })}

          {/* Players */}
          {players.map((player) => (
            <div
              key={player.id}
              className="absolute flex flex-col items-center"
              style={{
                left: player.position?.x || 400,
                top: player.position?.y || 300,
              }}
            >
              <div
                className={`w-6 h-6 rounded-full border-2 border-white ${
                  player.state === "dead"
                    ? "bg-gray-500 opacity-50"
                    : player.role === "impostor"
                    ? "bg-red-500"
                    : "bg-blue-500"
                }`}
              />
              <div className="text-white text-xs mt-1 bg-black bg-opacity-50 px-1 rounded">
                {player.name}
                {player.id === socket.id && " (You)"}
                {player.state === "dead" && " 💀"}
              </div>
            </div>
          ))}

          {/* Current player position indicator */}
          <div
            className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white animate-pulse z-10"
            style={{
              left: position.x - 8,
              top: position.y - 8,
            }}
          />
        </div>

        {/* Task Panel for Crewmates */}
        {currentPlayer.role === "crewmate" && (
          <div className="absolute top-20 left-4 bg-green-600 p-4 rounded-lg text-white max-w-xs">
            <h3 className="font-bold mb-2">
              🔧 Tasks ({currentPlayer.tasksCompleted || 0}/5)
            </h3>
            {(() => {
              const nearbyTask = TASK_LOCATIONS.find((task) => {
                const distance = Math.sqrt(
                  Math.pow(task.x - position.x, 2) +
                    Math.pow(task.y - position.y, 2)
                );
                return distance <= 40;
              });

              if (nearbyTask) {
                return (
                  <div className="bg-green-700 p-3 rounded mb-3">
                    <h4 className="font-semibold mb-2">⚙️ {nearbyTask.name}</h4>
                    <Button
                      onClick={() => {
                        socket.emit("complete-task");
                        console.log("Task completed!");
                      }}
                      variant="warning"
                      className="w-full text-black"
                    >
                      Complete Task
                    </Button>
                  </div>
                );
              } else {
                return (
                  <p className="text-sm mb-3">
                    🔍 Find yellow task markers on the map
                  </p>
                );
              }
            })()}
          </div>
        )}

        {/* Impostor Actions */}
        {currentPlayer.role === "impostor" && (
          <div className="absolute top-20 left-4 bg-red-600 p-4 rounded-lg text-white max-w-xs">
            <h3 className="font-bold mb-2">🔪 Impostor Actions</h3>
            {(() => {
              const nearbyPlayers = players.filter((player) => {
                if (player.id === currentPlayer.id) return false;
                if (player.state === "dead") return false;

                const distance = Math.sqrt(
                  Math.pow((player.position?.x || 400) - position.x, 2) +
                    Math.pow((player.position?.y || 300) - position.y, 2)
                );

                return distance <= 50;
              });

              if (nearbyPlayers.length > 0) {
                return (
                  <div className="space-y-2">
                    {nearbyPlayers.map((player) => (
                      <Button
                        key={player.id}
                        onClick={() => {
                          socket.emit("kill-player", player.id);
                          console.log("Attempting to kill:", player.name);
                        }}
                        variant="danger"
                        className="w-full"
                      >
                        Kill {player.name}
                      </Button>
                    ))}
                  </div>
                );
              } else {
                return (
                  <p className="text-sm">
                    Get close to crewmates to eliminate them
                  </p>
                );
              }
            })()}
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-4 left-4 bg-gray-900 bg-opacity-90 p-4 rounded-lg text-white">
          <h4 className="font-bold mb-2">🎮 Controls</h4>
          <div className="text-sm space-y-1">
            <p>WASD or Arrow Keys - Move</p>
            {currentPlayer.role === "crewmate" && (
              <p>🟡 Complete tasks (yellow markers)</p>
            )}
            {currentPlayer.role === "impostor" && (
              <p>🔪 Get close to players to eliminate</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
      <div>Game state: {gameState}</div>
    </div>
  );
}

export default App;
