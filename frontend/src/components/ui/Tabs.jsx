/**
 * Tabs Component
 * Reusable tabbed interface
 */

import React, { useState } from 'react';
import clsx from 'clsx';

export const Tabs = ({ tabs, defaultTab = 0, activeTab: controlledTab, onChange }) => {
  const [internalTab, setInternalTab] = useState(defaultTab);
  const activeTab = controlledTab !== undefined ? controlledTab : internalTab;

  const handleTabChange = (index) => {
    if (controlledTab === undefined) {
      setInternalTab(index);
    }
    onChange?.(index);
  };

  return (
    <div>
      {/* Tab List */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => handleTabChange(index)}
            className={clsx(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200',
              activeTab === index
                ? 'text-primary-600 border-primary-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {tabs[activeTab]?.content}
      </div>
    </div>
  );
};
