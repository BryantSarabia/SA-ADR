import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6">
      <AlertCircle className="w-12 h-12 text-red-600" />
      <p className="text-sm text-gray-900 font-medium">Error</p>
      <p className="text-sm text-gray-600 text-center max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}
