import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  incidentId: string;
};

const createIncidentId = () => `WEB-${Date.now().toString(36).toUpperCase()}`;

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    incidentId: '',
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return {
      hasError: true,
      incidentId: createIncidentId(),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled Picklink frontend error', {
      error,
      componentStack: info.componentStack,
      incidentId: this.state.incidentId,
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="grid min-h-dvh place-items-center bg-slate-50 px-5 py-12 text-slate-950">
        <section
          aria-labelledby="app-error-title"
          className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-10"
          role="alert"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
            <AlertTriangle aria-hidden="true" size={25} />
          </span>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-amber-700">
            Picklink gặp sự cố
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight" id="app-error-title">
            Trang chưa thể hiển thị
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            Dữ liệu của bạn vẫn được giữ nguyên. Hãy tải lại trang; nếu lỗi tiếp diễn, dùng mã bên dưới khi liên hệ hỗ trợ.
          </p>
          <p className="mt-5 rounded-xl bg-slate-100 px-4 py-3 font-mono text-sm text-slate-700">
            Mã lỗi: {this.state.incidentId}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
              onClick={() => window.location.reload()}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={18} />
              Tải lại trang
            </button>
            <a
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-800 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
              href="/"
            >
              <Home aria-hidden="true" size={18} />
              Về trang chủ
            </a>
          </div>
        </section>
      </main>
    );
  }
}
