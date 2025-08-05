import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const GAME_STATES = {
  MENU: "menu",
  LOBBY: "lobby",
  PLAYING: "playing",
  MEETING: "meeting",
  ENDED: "ended",
};

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

      // Set current player
      const player = players.find((p) => p.id === newSocket.id);
      setCurrentPlayer(player);
    });

    newSocket.on("player-joined", ({ players }) => {
      console.log("Player joined, total players:", players.length);
      setPlayers(players);
    });

    // Game events
    newSocket.on("game-started", ({ role, players, gameState }) => {
      console.log("🎮 Game started! Role:", role, "Players:", players.length);
      setPlayers(players);
      setGameState(GAME_STATES.PLAYING);

      // Update current player with role
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
      setGameState(GAME_STATES.ENDED);
      // Show win/lose message
      alert(
        `Game Over! ${
          result.winner === "crewmates"
            ? "🚀 Crewmates Win!"
            : "🔪 Impostors Win!"
        }\nReason: ${result.reason}`
      );
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

      // Boundary checking
      newX = Math.max(20, Math.min(780, newX));
      newY = Math.max(20, Math.min(580, newY));

      if (newX !== position.x || newY !== position.y) {
        const newPosition = { x: newX, y: newY };
        setPosition(newPosition);
        socket.emit("player-move", newPosition);
      }
    };

    const interval = setInterval(movePlayer, 16); // ~60fps
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

            <button
              onClick={handleCreateRoom}
              disabled={!inputName.trim() || !isConnected}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded transition duration-200"
            >
              Create Room
            </button>

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

            <button
              onClick={handleJoinRoom}
              disabled={
                !inputName.trim() || !inputRoomCode.trim() || !isConnected
              }
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded transition duration-200"
            >
              Join Room
            </button>
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Game Lobby</h1>
            <div className="text-xl text-blue-400 font-mono">
              Room Code:{" "}
              <span className="bg-gray-700 px-3 py-1 rounded">{roomCode}</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Players ({players.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="bg-gray-700 p-3 rounded-lg flex items-center justify-between"
                >
                  <span className="text-white font-medium">{player.name}</span>
                  {socket && player.id === socket.id && (
                    <span className="text-blue-400 text-sm">You</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {isHost && (
              <button
                onClick={handleStartGame}
                disabled={players.length < 2}
                className={`flex-1 font-bold py-3 px-6 rounded transition duration-200 ${
                  players.length >= 2
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                }`}
              >
                Start Game {players.length < 2 && "(Need 2+ players)"}
              </button>
            )}

            <button
              onClick={handleBackToMenu}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded transition duration-200"
            >
              Leave Room
            </button>
          </div>

          {!isHost && (
            <div className="mt-4 text-center text-gray-400">
              Waiting for host to start the game...
            </div>
          )}
        </div>
      </div>
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

          <button
            onClick={handleBackToMenu}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition duration-200"
          >
            Leave Game
          </button>
        </div>

        {/* Game Board */}
        <div className="relative w-full h-screen bg-gray-700 pt-20">
          {/* Task locations */}
          {[
            { id: 1, name: "Fix Wiring", x: 150, y: 150 },
            { id: 2, name: "Empty Trash", x: 650, y: 200 },
            { id: 3, name: "Fuel Engine", x: 500, y: 450 },
            { id: 4, name: "Calibrate Distributor", x: 300, y: 400 },
            { id: 5, name: "Scan Boarding Pass", x: 600, y: 350 },
          ].map((task) => (
            <div
              key={task.id}
              className="absolute w-8 h-8 bg-yellow-500 border-2 border-yellow-300 rounded"
              style={{
                left: task.x - 16,
                top: task.y - 16,
              }}
              title={task.name}
            >
              ⚙️
            </div>
          ))}

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
                    ? "bg-gray-500"
                    : player.role === "impostor"
                    ? "bg-red-500"
                    : "bg-blue-500"
                } ${player.state === "dead" ? "opacity-50" : ""}`}
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

        {/* Task Panel for Crewmates */}
        {currentPlayer.role === "crewmate" && (
          <div className="absolute top-20 left-4 bg-green-600 p-4 rounded-lg text-white max-w-xs">
            <h3 className="font-bold mb-2">
              🔧 Tasks ({currentPlayer.tasksCompleted || 0}/5)
            </h3>
            {(() => {
              const nearbyTask = [
                { id: 1, name: "Fix Wiring", x: 150, y: 150 },
                { id: 2, name: "Empty Trash", x: 650, y: 200 },
                { id: 3, name: "Fuel Engine", x: 500, y: 450 },
                { id: 4, name: "Calibrate Distributor", x: 300, y: 400 },
                { id: 5, name: "Scan Boarding Pass", x: 600, y: 350 },
              ].find((task) => {
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
                    <button
                      onClick={() => {
                        socket.emit("complete-task");
                        console.log("Task completed!");
                      }}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-3 rounded transition duration-200"
                    >
                      Complete Task
                    </button>
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
            <div className="text-xs space-y-1">
              <div>• Fix Wiring</div>
              <div>• Empty Trash</div>
              <div>• Fuel Engine</div>
              <div>• Calibrate Distributor</div>
              <div>• Scan Boarding Pass</div>
            </div>
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
                      <button
                        key={player.id}
                        onClick={() => {
                          socket.emit("kill-player", player.id);
                          console.log("Attempting to kill:", player.name);
                        }}
                        className="block w-full bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded transition duration-200 font-medium"
                      >
                        Kill {player.name}
                      </button>
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
            <div className="mt-3 text-xs opacity-75">
              Get within range of other players to see kill options
            </div>
          </div>
        )}
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
