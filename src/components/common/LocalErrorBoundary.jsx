import React from "react";
import { Alert, Button } from "antd";

class LocalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(_error, _errorInfo) {
    // Tangani error rendering lokal tanpa crash seluruh aplikasi
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return typeof this.props.fallback === "function"
          ? this.props.fallback({ error: this.state.error, reset: this.resetError })
          : this.props.fallback;
      }

      return (
        <div className="p-3 my-2 bg-red-50 border border-red-200 rounded-lg text-xs">
          <Alert
            title="Komponen Mengalami Kendala"
            description={String(this.state.error?.message || this.state.error || "Gagal menampilkan tampilan komponen.")}
            type="error"
            showIcon
            action={
              <Button size="small" danger onClick={this.resetError}>
                Tutup / Reset
              </Button>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default LocalErrorBoundary;
