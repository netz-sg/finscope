import { Component, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { GLASS_PANEL, TRANSITION } from '../design/tokens'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020202] text-white flex items-center justify-center p-8">
          <div className={`${GLASS_PANEL} rounded-3xl p-10 max-w-md w-full text-center`}>
            <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${GLASS_PANEL}`}>
              <AlertTriangle size={32} className="text-amber-400" />
            </div>
            <h2 className="text-xl font-black tracking-tight mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-white/40 leading-relaxed mb-8">
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={this.handleRetry}
              className={`inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-sm font-bold bg-white text-black hover:bg-neutral-200 ${TRANSITION}`}
            >
              <RotateCcw size={16} />
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
