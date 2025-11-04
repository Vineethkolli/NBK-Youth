import React from 'react';
import { RefreshCw, Home, Info } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/'; // Navigates to home and refreshes
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-yellow-200 via-orange-300 to-red-200">
          <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md text-center">
            <h1 className="text-2xl font-bold mb-4 text-red-600">Oops! Something went wrong</h1>
            <p className="text-gray-700 mb-6">
              We couldn&apos;t load this part of the app. You can try reloading or go back home.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-4">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <RefreshCw size={18} />
                Reload
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
              >
                <Home size={18} />
                Go Home
              </button>

              <button
                onClick={this.toggleDetails}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
              >
                <Info size={18} />
                {this.state.showDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            {this.state.showDetails && (
              <div className="text-left text-gray-600 bg-gray-50 p-4 mt-4 rounded-lg whitespace-pre-wrap max-h-64 overflow-auto">
                <h3 className="font-semibold text-sm mb-2">Error Details:</h3>
                <div>
                  <strong>Error Message:</strong>
                  <br />
                  {this.state.error?.toString()}
                </div>
                <br />
                <div>
                  <strong>Component Stack:</strong>
                  {this.state.errorInfo?.componentStack}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
