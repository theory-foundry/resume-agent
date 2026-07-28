import {
  createElement,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactElement,
} from "react";
import type { WidgetConfig } from "@resume-agent/contracts";
import {
  type ResumeAgentErrorDetail,
  type ResumeAgentRequestDetail,
  type ResumeAgentResponseDetail,
} from "./widget.js";
import "./index.js";

export interface ResumeAgentProps extends Partial<WidgetConfig> {
  className?: string;
  style?: CSSProperties;
  onReady?: () => void;
  onRequest?: (detail: ResumeAgentRequestDetail) => void;
  onResponse?: (detail: ResumeAgentResponseDetail) => void;
  onError?: (detail: ResumeAgentErrorDetail) => void;
}

export function ResumeAgent({
  className,
  style,
  onReady,
  onRequest,
  onResponse,
  onError,
  ...config
}: ResumeAgentProps): ReactElement {
  const elementRef = useRef<HTMLElement | null>(null);
  const readyNotified = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    (element as HTMLElement & { config: Partial<WidgetConfig> }).config = config;

    const ready = () => {
      if (!readyNotified.current) {
        readyNotified.current = true;
        onReady?.();
      }
    };
    const request = (event: Event) =>
      onRequest?.((event as CustomEvent<ResumeAgentRequestDetail>).detail);
    const response = (event: Event) =>
      onResponse?.((event as CustomEvent<ResumeAgentResponseDetail>).detail);
    const error = (event: Event) =>
      onError?.((event as CustomEvent<ResumeAgentErrorDetail>).detail);

    element.addEventListener("resume-agent:ready", ready);
    element.addEventListener("resume-agent:request", request);
    element.addEventListener("resume-agent:response", response);
    element.addEventListener("resume-agent:error", error);
    if (element.shadowRoot) ready();
    return () => {
      element.removeEventListener("resume-agent:ready", ready);
      element.removeEventListener("resume-agent:request", request);
      element.removeEventListener("resume-agent:response", response);
      element.removeEventListener("resume-agent:error", error);
    };
  }, [config, onReady, onRequest, onResponse, onError]);

  return createElement("resume-agent-chat", {
    className,
    style,
    ref: (element: HTMLElement | null) => {
      elementRef.current = element;
    },
  });
}
