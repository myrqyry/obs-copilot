// This component is a placeholder or for future development.
// It is currently not used in the application.
// Add relevant code here if MCP (Media Control Protocol) server interaction is implemented.

import React from 'react';

const McpInfoPanel: React.FC = () => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2 text-purple-400">MCP Server Info (Placeholder)</h3>
      <p className="text-gray-400 text-sm">
        MCP server integration details would appear here.
      </p>
      {/* Example:
      <div>
        <p>Status: Not Connected</p>
        <button className="mt-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm">Connect to MCP</button>
      </div>
      */}
    </div>
  );
};

export default McpInfoPanel;
