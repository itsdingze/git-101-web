import { Component, type ReactNode } from 'react'
import { messages } from '@/messages/en'

interface DiagramErrorBoundaryProps {
  children: ReactNode
}

interface DiagramErrorBoundaryState {
  failed: boolean
}

export class DiagramErrorBoundary extends Component<DiagramErrorBoundaryProps, DiagramErrorBoundaryState> {
  state: DiagramErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): DiagramErrorBoundaryState {
    return { failed: true }
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children

    return (
      <p className="rounded-xl border border-border bg-bg-secondary px-5 py-3.5 text-sm text-text-secondary">
        {messages.reading.diagramFailed}
      </p>
    )
  }
}
