import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-5 shadow-md w-full flex-shrink-0">
      <div className="flex items-baseline gap-4">
        <h1 className="text-2xl font-semibold m-0">MyDesk</h1>
        <span className="text-sm opacity-85">Your Personal Workspace</span>
      </div>
    </header>
  );
};

export default Header;
