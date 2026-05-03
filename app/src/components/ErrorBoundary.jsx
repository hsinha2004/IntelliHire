import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center w-full h-full min-h-[500px] bg-slate-100/50 rounded-xl border border-slate-200">
          <div className="text-center p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">3D Scene Unavailable</h3>
            <p className="text-sm text-slate-500">The interactive element failed to load.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
