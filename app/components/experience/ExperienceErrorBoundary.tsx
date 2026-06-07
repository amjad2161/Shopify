import {Component, type ReactNode} from 'react';
import {publishExperienceEvent} from '~/lib/experience-analytics';

type ExperienceErrorBoundaryProps = {
  children: ReactNode;
  onFallback: (reason: string) => void;
  publish?: unknown;
};

type ExperienceErrorBoundaryState = {
  hasError: boolean;
};

/** Catches WebGL / R3F runtime failures and triggers the classic homepage fallback. */
export class ExperienceErrorBoundary extends Component<
  ExperienceErrorBoundaryProps,
  ExperienceErrorBoundaryState
> {
  state: ExperienceErrorBoundaryState = {hasError: false};

  static getDerivedStateFromError(): ExperienceErrorBoundaryState {
    return {hasError: true};
  }

  componentDidCatch(error: Error) {
    const reason = error.message || 'webgl_runtime_error';
    publishExperienceEvent(this.props.publish, {
      event: '3d_webgl_error',
      reason,
    });
    this.props.onFallback(reason);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
