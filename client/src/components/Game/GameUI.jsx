import React from "react";
import { getRoleColor, getRoleIcon } from "../../utils/helpers";
import Button from "../Common/Button";

const GameUI = ({ currentPlayer, onBackToMenu }) => {
  if (!currentPlayer) return null;

  return (
    <div className="absolute top-0 left-0 right-0 bg-gray-900 bg-opacity-95 p-4 flex justify-between items-center z-20 shadow-lg">
      {/* Player info */}
      <div className="flex items-center space-x-6">
        <div className="text-white">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg">{currentPlayer.name}</span>
            <span
              className={`font-semibold ${getRoleColor(currentPlayer.role)}`}
            >
              {getRoleIcon(currentPlayer.role)}{" "}
              {currentPlayer.role?.toUpperCase()}
            </span>
          </div>
        </div>

        {currentPlayer.role === "crewmate" && (
          <div className="text-green-400 flex items-center space-x-2">
            <span className="text-sm">Tasks:</span>
            <span className="font-bold">{currentPlayer.tasksCompleted}/5</span>
            <div className="w-20 bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-400 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(currentPlayer.tasksCompleted / 5) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Game status */}
      <div className="text-center">
        <div
          className={`text-lg font-bold flex items-center space-x-2 ${
            currentPlayer.state === "alive" ? "text-green-400" : "text-red-400"
          }`}
        >
          <span>
            {currentPlayer.state === "alive" ? "👤 ALIVE" : "💀 DEAD"}
          </span>
        </div>
        {currentPlayer.state === "dead" && (
          <div className="text-gray-400 text-sm mt-1">
            You can still observe the game
          </div>
        )}
      </div>

      {/* Menu button */}
      <Button onClick={onBackToMenu} variant="danger" size="small">
        Leave Game
      </Button>
    </div>
  );
};

export default GameUI;
