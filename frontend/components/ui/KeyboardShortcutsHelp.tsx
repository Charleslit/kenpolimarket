'use client';

import { useState, useEffect } from 'react';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  { keys: ['/', 'Ctrl', 'K'], description: 'Focus search', category: 'Navigation' },
  { keys: ['Esc'], description: 'Clear search / Close modal', category: 'Navigation' },
  { keys: ['1'], description: 'National view', category: 'Views' },
  { keys: ['2'], description: 'Regional view', category: 'Views' },
  { keys: ['3'], description: 'Comparison view', category: 'Views' },
  { keys: ['4'], description: 'County explorer', category: 'Views' },
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'Help' },
  { keys: ['Ctrl', 'S'], description: 'Share current view', category: 'Actions' },
  { keys: ['Ctrl', 'E'], description: 'Export data', category: 'Actions' },
];

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setIsOpen(true);
      }
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-900 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors z-40"
        aria-label="Show keyboard shortcuts"
        title="Keyboard shortcuts (?)"
      >
        <span className="text-xl">⌨️</span>
      </button>
    );
  }

  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center">
                  <span className="mr-3">⌨️</span>
                  Keyboard Shortcuts
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  Navigate faster with these shortcuts
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                aria-label="Close"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {categories.map((category) => (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts
                    .filter((s) => s.category === category)
                    .map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-gray-700">{shortcut.description}</span>
                        <div className="flex items-center space-x-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <span key={keyIndex} className="flex items-center">
                              <kbd className="px-3 py-1 bg-white border border-gray-300 rounded shadow-sm text-sm font-mono font-semibold text-gray-800">
                                {key}
                              </kbd>
                              {keyIndex < shortcut.keys.length - 1 && (
                                <span className="mx-1 text-gray-400">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-4 rounded-b-lg border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">?</kbd> anytime to show this help
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

