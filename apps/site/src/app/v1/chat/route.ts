import { CHAT_API_VERSION, CHAT_ENDPOINT } from "@resume-agent/contracts";
import { NextRequest, NextResponse } from "next/server";
import { ProxyBodyTooLargeError, readJsonBody } from "./proxy-body";

const gatewayBaseUrl = process.env.RESUME_AGENT_GATEWAY_URL ?? "http://127.0.0.1:8788";
const gatewayAccessToken = process.env.RESUME_AGENT_GATEWAY_TOKEN;
const siteOrigin = process.env.RESUME_AGENT_SITE_ORIGIN;
const proxyMaxBodyBytes = Number.parseInt(
  process.env.RESUME_AGENT_PROXY_MAX_BODY_BYTES ?? "65536",
  10,
);
if (!Number.isSafeInteger(proxyMaxBodyBytes) || proxyMaxBodyBytes <= 0) {
  throw new Error("RESUME_AGENT_PROXY_MAX_BODY_BYTES must be a positive integer.");
}
if (siteOrigin && new URL(siteOrigin).origin !== siteOrigin) {
  throw new Error("RESUME_AGENT_SITE_ORIGIN must contain only scheme and authority.");
}

export async function POST(request: NextRequest) {
  let body: {
    version?: string;
    id?: string;
    conversationId?: string;
    messageId?: string;
    messages?: unknown[];
    trigger?: "submit-message" | "regenerate-message";
  };
  try {
    body = await readJsonBody(request, proxyMaxBodyBytes) as typeof body;
  } catch (error) {
    if (error instanceof ProxyBodyTooLargeError) {
      return NextResponse.json(
        { code: "message_too_long", message: error.message },
        { status: 413 },
      );
    }
    return NextResponse.json(
      { code: "invalid_request", message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const headers: Record<string, string> = { "content-type": "application/json" };
  if (gatewayAccessToken) headers.authorization = `Bearer ${gatewayAccessToken}`;
  if (siteOrigin) headers.origin = siteOrigin;

  let response: Response;
  try {
    response = await fetch(new URL(CHAT_ENDPOINT, gatewayBaseUrl), {
      body: JSON.stringify({
        version: body.version ?? CHAT_API_VERSION,
        conversationId: body.conversationId ?? body.id ?? crypto.randomUUID(),
        messages: body.messages ?? [],
        trigger: body.trigger ?? "submit-message",
        messageId: body.messageId,
      }),
      headers,
      method: "POST",
      signal: request.signal,
    });
  } catch {
    return NextResponse.json(
      {
        code: "gateway_unavailable",
        message: "The resume chat gateway is not running. Start it with npm run dev:runtime.",
      },
      { status: 503 },
    );
  }

  return new Response(response.body, {
    headers: response.headers,
    status: response.status,
  });
}
