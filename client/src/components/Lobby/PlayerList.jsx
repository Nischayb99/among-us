import React from "react";

const PlayerList = ({ players, currentPlayerId, hostId }) => {
  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-3">
        Players ({players.length}/10)
      </h3>

      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.id}
            className="flex items-center justify-between bg-gray-600 p-3 rounded"
          >
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-white font-medium">{player.name}</span>
            </div>

            <div className="flex items-center space-x-2">
              {player.id === hostId && (
                <span className="text-yellow-400 text-xs bg-yellow-400 bg-opacity-20 px-2 py-1 rounded">
                  HOST
                </span>
              )}
              {player.id === currentPlayerId && (
                <span className="text-blue-400 text-xs">You</span>
              )}
            </div>
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: 10 - players.length }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="flex items-center bg-gray-800 p-3 rounded opacity-50"
          >
            <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
            <span className="text-gray-500">Waiting for player...</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerList;
