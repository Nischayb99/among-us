import React, { useState, useEffect, useCallback } from "react";
import { useGame } from "../../hooks/useGame";
import { TASK_LOCATIONS, GAME_CONFIG } from "../../utils/constants";
import {
  canInteractWithTask,
  canKillPlayer,
  getNearbyPlayers,
} from "../../utils/helpers";
import Player from "./Player";
import TaskPanel from "./TaskPanel";
import GameUI from "./GameUI";

const GameBoard = ({ players, currentPlayer, tasks, onBackToMenu }) => {
  const { movePlayer, killPlayer, completeTask, reportBody } = useGame();
  const [position, setPosition] = useState({ x: 400, y: 300 });
  const [keys, setKeys] = useState({});
  const [nearbyPlayers, setNearbyPlayers] = useState([]);
  const [deadBodies, setDeadBodies] = useState([]);
  const [gameMap] = useState(tasks || TASK_LOCATIONS);

  // Handle keyboard input
  useEffect(() => {
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
  }, []);

  // Movement logic
  useEffect(() => {
    if (currentPlayer?.state !== "alive") return;

    const movePlayerPosition = () => {
      let newX = position.x;
      let newY = position.y;
      const speed = GAME_CONFIG.MOVE_SPEED;

      if (keys["w"] || keys["arrowup"]) newY -= speed;
      if (keys["s"] || keys["arrowdown"]) newY += speed;
      if (keys["a"] || keys["arrowleft"]) newX -= speed;
      if (keys["d"] || keys["arrowright"]) newX += speed;

      // Boundary checking
      newX = Math.max(20, Math.min(GAME_CONFIG.MAP_WIDTH - 20, newX));
      newY = Math.max(20, Math.min(GAME_CONFIG.MAP_HEIGHT - 20, newY));

      if (newX !== position.x || newY !== position.y) {
        const newPosition = { x: newX, y: newY };
        setPosition(newPosition);
        movePlayer(newPosition);
      }
    };

    const interval = setInterval(movePlayerPosition, GAME_CONFIG.UPDATE_RATE);
    return () => clearInterval(interval);
  }, [keys, position, movePlayer, currentPlayer]);

  // Check nearby players for interactions
  useEffect(() => {
    if (!currentPlayer) return;

    const nearby = getNearbyPlayers(
      { ...currentPlayer, position },
      players,
      GAME_CONFIG.KILL_RANGE
    );
    setNearbyPlayers(nearby);
  }, [players, position, currentPlayer]);

  // Update dead bodies from player states
  useEffect(() => {
    const bodies = players
      .filter((p) => p.state === "dead")
      .map((p) => ({
        playerId: p.id,
        position: p.position,
        reportedBy: null,
      }));
    setDeadBodies(bodies);
  }, [players]);

  const handleKill = useCallback(
    (targetId) => {
      killPlayer(targetId);
    },
    [killPlayer]
  );

  const handleCompleteTask = useCallback(
    (taskId) => {
      completeTask();
    },
    [completeTask]
  );

  const handleReportBody = useCallback(
    (bodyInfo) => {
      reportBody(bodyInfo);
    },
    [reportBody]
  );

  const canInteractWithTaskAtPosition = (task) => {
    return canInteractWithTask(position, task, GAME_CONFIG.TASK_RANGE);
  };

  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        Loading game...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800 relative overflow-hidden">
      {/* Game UI */}
      <GameUI currentPlayer={currentPlayer} onBackToMenu={onBackToMenu} />

      {/* Game Board */}
      <div
        className="relative w-full h-screen bg-gray-700"
        style={{
          width: GAME_CONFIG.MAP_WIDTH,
          height: GAME_CONFIG.MAP_HEIGHT,
          margin: "0 auto",
        }}
      >
        {/* Task locations */}
        {gameMap.map((task) => (
          <div
            key={task.id}
            className={`absolute w-8 h-8 rounded border-2 transition-all duration-200 ${
              canInteractWithTaskAtPosition(task)
                ? "bg-yellow-400 border-yellow-300 animate-pulse scale-110"
                : "bg-gray-500 border-gray-400"
            }`}
            style={{
              left: task.x - 16,
              top: task.y - 16,
            }}
            title={task.name}
          >
            <div className="w-full h-full flex items-center justify-center text-xs font-bold">
              ⚙️
            </div>
          </div>
        ))}

        {/* Dead bodies */}
        {deadBodies.map((body, index) => (
          <div
            key={`body-${index}`}
            className="absolute w-6 h-6 bg-red-600 rounded-full border-2 border-red-400 cursor-pointer hover:scale-110 transition-transform"
            style={{
              left: body.position.x - 12,
              top: body.position.y - 12,
            }}
            onClick={() => handleReportBody(body)}
            title="Report body"
          >
            💀
          </div>
        ))}

        {/* Players */}
        {players.map((player) => (
          <Player
            key={player.id}
            player={player}
            isCurrentPlayer={player.id === currentPlayer.id}
            canKill={
              currentPlayer.role === "impostor" &&
              currentPlayer.state === "alive" &&
              nearbyPlayers.some((p) => p.id === player.id)
            }
            onKill={() => handleKill(player.id)}
          />
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
        <TaskPanel
          tasks={gameMap}
          currentPosition={position}
          onCompleteTask={handleCompleteTask}
          completedTasks={currentPlayer.tasksCompleted}
          totalTasks={5}
        />
      )}

      {/* Impostor Actions Panel */}
      {currentPlayer.role === "impostor" && nearbyPlayers.length > 0 && (
        <div className="absolute top-20 right-4 bg-red-600 p-4 rounded-lg shadow-xl max-w-xs">
          <h3 className="text-white font-bold mb-3 flex items-center">
            🔪 Impostor Actions
          </h3>
          <div className="space-y-2">
            {nearbyPlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => handleKill(player.id)}
                className="block w-full bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded transition duration-200 text-sm font-medium"
              >
                Kill {player.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls Help */}
      <div className="absolute bottom-4 left-4 bg-gray-900 bg-opacity-90 p-4 rounded-lg shadow-xl text-white max-w-xs">
        <h4 className="font-bold mb-2">🎮 Controls</h4>
        <div className="text-sm space-y-1">
          <p>WASD or Arrow Keys - Move</p>
          {currentPlayer.role === "crewmate" && (
            <p>🟡 Get close to yellow tasks to complete them</p>
          )}
          {currentPlayer.role === "impostor" && (
            <p>🔪 Get close to players to eliminate them</p>
          )}
          <p>💀 Click dead bodies to report them</p>
        </div>
      </div>

      {/* Game Status */}
      <div className="absolute bottom-4 right-4 bg-gray-900 bg-opacity-90 p-4 rounded-lg shadow-xl text-white">
        <div className="text-center">
          <div className="text-sm opacity-75">Players Alive</div>
          <div className="text-2xl font-bold">
            {players.filter((p) => p.state === "alive").length}/{players.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
