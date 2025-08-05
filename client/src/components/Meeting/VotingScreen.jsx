import React, { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import VoteButton from './VoteButton';
import Button from '../Common/Button';

const VotingScreen = ({ players, currentPlayer, meetingInfo }) => {
  const { castVote } = useGame();
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

  const alivePlayers = players.filter(p => p.state === 'alive');
  const caller = players.find(p => p.id === meetingInfo?.callerId);

  const handleVote = (playerId) => {
    if (hasVoted || currentPlayer.state !== 'alive') return;
    
    setSelectedPlayer(playerId);
    setHasVoted(true);
    castVote(playerId);
  };

  const handleSkipVote = () => {
    if (hasVoted || currentPlayer.state !== 'alive') return;
    
    setHasVoted(true);
    castVote(null); // Skip vote
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-6xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🚨 Emergency Meeting</h1>
          <p className="text-gray-300 text-lg">
            {caller ? `${caller.name} called the meeting` : 'Meeting in progress'}
          </p>
          {meetingInfo?.reason === 'body-reported' && (
            <p className="text-red-400 mt-2 font-semibold">💀 A dead body was reported!</p>
          )}
          {meetingInfo?.reason === 'emergency' && (
            <p className="text-yellow-400 mt-2 font-semibold">⚠️ Emergency meeting called!</p>
          )}
        </div>

        {currentPlayer.state === 'alive' ? (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-6 text-center">
                Who is the impostor?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {alivePlayers
                  .filter(p => p.id !== currentPlayer.id)
                  .map(player => (
                    <VoteButton
                      key={player.id}
                      player={player}
                      onVote={handleVote}
                      disabled={hasVoted}
                      selected={selectedPlayer === player.id}
                    />
                  ))}
              </div>
            </div>

            <div className="text-center">
              <Button
                onClick={handleSkipVote}
                disabled={hasVoted}
                variant={hasVoted ? "secondary" : "warning"}
                size="large"
              >
                {hasVoted ? '✓ Vote Cast' : 'Skip Vote'}
              </Button>
            </div>

            {hasVoted && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg">
                  <span>✅</span>
                  <span className="font-medium">Your vote has been recorded</span>
                </div>
                <p className="text-gray-400 mt-2">Waiting for other players to vote...</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-red-400 text-6xl mb-4">💀</div>
            <div className="text-red-400 text-2xl font-bold mb-4">You are dead</div>
            <div className="text-gray-400 text-lg">
              You cannot vote, but you can watch the discussion.
            </div>
          </div>
        )}

        <div className="mt-8 border-t border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-white mb-4 text-center">
            Meeting Participants
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {players.map(player => (
              <div
                key={player.id}
                className={`p-3 rounded-lg text-center transition-all duration-200 ${
                  player.state === 'alive' 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-800 text-gray-500'
                }`}
              >
                <div className="text-2xl mb-1">
                  {player.state === 'alive' ? '👤' : '💀'}
                </div>
                <div className="font-medium text-sm">{player.name}</div>
                <div className="text-xs opacity-75">
                  {player.id === currentPlayer.id && '(You)'}
                  {player.id === meetingInfo?.callerId && '📢'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-4 text-gray-400 text-sm">
            <div className="flex items-center space-x-1">
              <span>👤</span>
              <span>Alive: {alivePlayers.length}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>💀</span>
              <span>Dead: {players.length - alivePlayers.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingScreen;