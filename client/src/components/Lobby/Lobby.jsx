import React from 'react';
import PlayerList from './PlayerList';
import Button from '../Common/Button';
import { copyToClipboard } from '../../utils/helpers';

const Lobby = ({ roomCode, players, currentPlayer, isHost, onStartGame, onBackToMenu }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyRoomCode = async () => {
    const success = await copyToClipboard(roomCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-4xl w-full">
        <div className="text-center mb-8">
          
          <Button
            onClick={onBackToMenu}
            variant="danger"
            className="flex-1"
          >
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

export default Lobby;