import React from "react";

const VoteButton = ({
  player,
  onVote,
  disabled,
  selected,
  showVoteCount = false,
  voteCount = 0,
}) => {
  const handleClick = () => {
    if (!disabled) {
      onVote(player.id);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative p-4 rounded-lg border-2 transition-all duration-200 text-left
        ${
          selected
            ? "bg-red-600 border-red-500 text-white transform scale-105"
            : disabled
            ? "bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed"
            : "bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500 hover:transform hover:scale-105"
        }
      `}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-lg">{player.name}</div>
          <div className="text-sm opacity-75">
            {selected ? "Selected for ejection" : "Click to vote"}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div
            className={`w-8 h-8 rounded-full ${
              player.state === "dead"
                ? "bg-gray-500"
                : player.role === "impostor"
                ? "bg-red-500"
                : "bg-blue-500"
            }`}
          ></div>

          {showVoteCount && voteCount > 0 && (
            <div className="mt-1 bg-red-500 text-white text-xs px-2 py-1 rounded">
              {voteCount} vote{voteCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="absolute inset-0 bg-red-500 bg-opacity-20 rounded-lg pointer-events-none">
          <div className="absolute top-2 right-2 text-white">✓</div>
        </div>
      )}
    </button>
  );
};

export default VoteButton;
