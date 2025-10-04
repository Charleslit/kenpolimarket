interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showSupport?: boolean;
}

export default function ErrorMessage({ 
  title = "Oops! Something went wrong",
  message, 
  onRetry,
  showSupport = true 
}: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-md mx-auto">
      <div className="text-6xl mb-4">😕</div>
      <h3 className="text-xl font-semibold text-red-900 mb-2">
        {title}
      </h3>
      <p className="text-red-700 mb-6">
        {message}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {onRetry && (
          <button 
            onClick={onRetry}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            🔄 Try Again
          </button>
        )}
        
        {showSupport && (
          <a
            href="mailto:support@kenpolimarket.com"
            className="border border-red-600 text-red-600 px-6 py-3 rounded-lg hover:bg-red-50 transition-colors font-medium"
          >
            📧 Contact Support
          </a>
        )}
      </div>
      
      <p className="text-xs text-gray-500 mt-6">
        Error details have been logged. Our team has been notified.
      </p>
    </div>
  );
}

export function EmptyState({ 
  icon = "📭",
  title = "No data available",
  message = "There's nothing to show here yet.",
  action
}: {
  icon?: string;
  title?: string;
  message?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 mb-6">
        {message}
      </p>
      
      {action && (
        <button
          onClick={action.onClick}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

