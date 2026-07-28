export {
  createChatHeaders,
  createChatRequest,
  createChatUrl,
  readChatResponse,
} from "./protocol.js";
export {
  defineResumeAgentElement,
  RESUME_AGENT_TAG,
  ResumeAgentElement,
  type ResumeAgentErrorDetail,
  type ResumeAgentEventName,
  type ResumeAgentRequestDetail,
  type ResumeAgentResponseDetail,
} from "./widget.js";

export type { WidgetConfig, WidgetTheme } from "@resume-agent/contracts";

import { defineResumeAgentElement } from "./widget.js";

defineResumeAgentElement();
