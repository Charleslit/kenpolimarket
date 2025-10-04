'use client';

import { useEffect, useState } from 'react';

interface TickerItem {
  id: string;
  type: 'update' | 'insight' | 'alert';
  message: string;
  timestamp: Date;
  icon: string;
}

export default function LiveTicker() {
  const [items, setItems] = useState<TickerItem[]>([
    {
      id: '1',
      type: 'update',
      message: 'Model updated with latest polling data from Infotrak',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      icon: '🔄',
    },
    {
      id: '2',
      type: 'insight',
      message: 'Ruto leads in 25 counties, Matiang\'i gaining in 18 counties',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      icon: '📊',
    },
    {
      id: '3',
      type: 'alert',
      message: 'Tight race in Nairobi: Margin within 5%',
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      icon: '⚠️',
    },
    {
      id: '4',
      type: 'update',
      message: 'Forecast confidence increased to 85% after new data',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      icon: '📈',
    },
    {
      id: '5',
      type: 'insight',
      message: 'Fred Matiang\'i gaining ground in Central region',
      timestamp: new Date(Date.now() - 1000 * 60 * 90),
      icon: '🎯',
    },
  ]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'update':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'insight':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'alert':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 border-b border-blue-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
            <span className="animate-pulse mr-2">🔴</span>
            Live Updates
          </h3>
          <span className="text-blue-100 text-xs sm:text-sm">Last updated: {formatTimestamp(items[0].timestamp)}</span>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`p-3 sm:p-4 hover:bg-gray-50 transition-colors ${
                index === 0 ? 'animate-fadeIn' : ''
              }`}
            >
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="flex-shrink-0">
                  <span className="text-xl sm:text-2xl">{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(
                        item.type
                      )}`}
                    >
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500">{formatTimestamp(item.timestamp)}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-900">{item.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-200">
        <button className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium">
          View all updates →
        </button>
      </div>
    </div>
  );
}

