import React from "react";
import { canInteractWithTask } from "../../utils/helpers";
import { GAME_CONFIG } from "../../utils/constants";

const TaskPanel = ({
  tasks,
  currentPosition,
  onCompleteTask,
  completedTasks,
  totalTasks = 5,
}) => {
  const nearbyTask = tasks.find((task) =>
    canInteractWithTask(currentPosition, task, GAME_CONFIG.TASK_RANGE)
  );

  const progress = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="absolute top-20 left-4 bg-green-600 p-4 rounded-lg shadow-xl max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold">🔧 Tasks</h3>
        <div className="text-white text-sm">
          {completedTasks}/{totalTasks}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-green-800 rounded-full h-2 mb-4">
        <div
          className="bg-green-400 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {nearbyTask ? (
        <div className="bg-green-700 p-3 rounded mb-3">
          <h4 className="text-white font-semibold mb-2 flex items-center">
            ⚙️ {nearbyTask.name}
          </h4>
          <button
            onClick={() => onCompleteTask(nearbyTask.id)}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded transition duration-200"
          >
            Complete Task
          </button>
        </div>
      ) : (
        <div className="bg-green-700 p-3 rounded mb-3">
          <p className="text-white text-sm">
            🔍 Find yellow task markers on the map
          </p>
        </div>
      )}

      <div className="space-y-1">
        <div className="text-white text-xs font-semibold mb-2">
          Task Progress:
        </div>
        {tasks.slice(0, totalTasks).map((task, index) => (
          <div key={task.id} className="flex items-center text-white text-xs">
            <span
              className={`w-2 h-2 rounded-full mr-2 ${
                index < completedTasks ? "bg-green-400" : "bg-gray-400"
              }`}
            />
            <span
              className={`${
                index < completedTasks ? "line-through opacity-75" : ""
              }`}
            >
              {task.name}
            </span>
            {index < completedTasks && (
              <span className="ml-auto text-green-400">✓</span>
            )}
          </div>
        ))}
      </div>

      {completedTasks === totalTasks && (
        <div className="mt-3 p-2 bg-green-500 rounded text-center">
          <div className="text-white font-bold text-sm">
            🎉 All Tasks Complete!
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskPanel;
