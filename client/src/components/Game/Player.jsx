import React from "react";

const Player = ({ player, isCurrentPlayer, canKill, onKill }) => {
  const getPlayerColor = () => {
    if (player.state === "dead") return "bg-gray-500";
    if (player.role === "impostor") return "bg-red-500";
    return "bg-blue-500";
  };

  const getPlayerSize = () => {
    return isCurrentPlayer ? "w-8 h-8" : "w-6 h-6";
  };

  return (
    <div
      className="absolute flex flex-col items-center transition-all duration-100"
      style={{
        left: player.position.x - (isCurrentPlayer ? 16 : 12),
        top: player.position.y - (isCurrentPlayer ? 16 : 12),
      }}
    >
      {/* Player circle */}
      <div
        className={`${getPlayerColor()} ${getPlayerSize()} rounded-full border-2 ${
          isCurrentPlayer ? "border-white" : "border-gray-300"
        } ${player.state === "dead" ? "opacity-50" : ""}`}
      />

      {/* Player name */}
      <div className="text-white text-xs mt-1 bg-black bg-opacity-50 px-1 rounded whitespace-nowrap">
        {player.name}
        {player.state === "dead" && " 💀"}
      </div>

      {/* Kill button for impostors */}
      {canKill && !isCurrentPlayer && player.state === "alive" && (
        <button
          onClick={onKill}
          className="absolute -top-8 bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded transition duration-200"
        >
          Kill
        </button>
      )}
    </div>
  );
};

export default Player;
