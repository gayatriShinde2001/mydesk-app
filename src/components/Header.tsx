import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="app-title">MyDesk</h1>
        <span className="app-subtitle">Your Personal Workspace</span>
      </div>
    </header>
  );
};

export default Header;
