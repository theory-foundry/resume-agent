import assert from "node:assert/strict";
import test from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { exampleProfile } from "@resume-agent/profile";

import { startMcpServer } from "./http.js";

test("official MCP client can discover and use the stateless resume server", async () => {
  const running = await startMcpServer({ port: 0, profile: exampleProfile });
  const client = new Client({ name: "resume-agent-test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(running.url));

  try {
    await client.connect(transport);

    const tools = await client.listTools();
    assert.deepEqual(
      tools.tools.map((tool) => tool.name).sort(),
      ["get_contact", "get_experience", "get_project", "search_profile"],
    );

    const search = await client.callTool({
      name: "search_profile",
      arguments: { query: "TypeScript" },
    });
    assert.equal(search.isError, undefined);
    assert.match(JSON.stringify(search.structuredContent), /team-workspace/);

    const resources = await client.listResources();
    assert.ok(resources.resources.some((resource) => resource.uri === "resume://profile"));
    assert.ok(
      resources.resources.some(
        (resource) => resource.uri === "resume://projects/team-workspace",
      ),
    );

    const templates = await client.listResourceTemplates();
    assert.deepEqual(
      templates.resourceTemplates.map((template) => template.uriTemplate).sort(),
      ["resume://articles/{id}", "resume://projects/{id}"],
    );

    const profile = await client.readResource({ uri: "resume://profile" });
    const profileContent = profile.contents[0];
    assert.ok(profileContent && "text" in profileContent);
    assert.match(profileContent.text, /Alex Morgan/);

    const project = await client.readResource({
      uri: "resume://projects/team-workspace",
    });
    const projectContent = project.contents[0];
    assert.ok(projectContent && "text" in projectContent);
    assert.match(projectContent.text, /Team Workspace/);

    const prompts = await client.listPrompts();
    assert.deepEqual(prompts.prompts.map((prompt) => prompt.name), ["resume_assistant"]);
    const prompt = await client.getPrompt({
      name: "resume_assistant",
      arguments: { audience: "a hiring manager", goal: "evaluate fit" },
    });
    assert.match(prompt.messages[0]?.content.type === "text" ? prompt.messages[0].content.text : "", /hiring manager/);
  } finally {
    await client.close().catch(() => undefined);
    await running.close();
  }
});

test("health endpoints are public while local MCP rejects unlisted supplied origins", async () => {
  const running = await startMcpServer({ port: 0, profile: exampleProfile });
  const baseUrl = new URL(running.url);

  try {
    const health = await fetch(new URL("/healthz", baseUrl));
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: "ok" });

    const forbidden = await fetch(running.url, {
      method: "POST",
      headers: {
        accept: "application/json, text/event-stream",
        "content-type": "application/json",
        origin: "https://unlisted.example",
      },
      body: "{}",
    });
    assert.equal(forbidden.status, 403);
  } finally {
    await running.close();
  }
});

test("remote MCP requires canonical origin and timing-safe bearer validation", async () => {
  const origin = "https://gateway.example";
  const running = await startMcpServer({
    port: 0,
    profile: exampleProfile,
    securityMode: "remote",
    allowedOrigins: [origin],
    serviceToken: "service-secret",
  });

  try {
    const rejectedHeaders: Record<string, string>[] = [
      { authorization: "Bearer service-secret" },
      { origin, authorization: "Bearer wrong" },
      { origin: "https://browser.example", authorization: "Bearer service-secret" },
    ];
    for (const headers of rejectedHeaders) {
      const response = await fetch(running.url, {
        method: "POST",
        headers: {
          accept: "application/json, text/event-stream",
          "content-type": "application/json",
          ...headers,
        },
        body: "{}",
      });
      assert.equal(response.status, 403);
    }

    const client = new Client({ name: "remote-resume-agent-test", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL(running.url), {
      requestInit: {
        headers: {
          origin,
          authorization: "Bearer service-secret",
        },
      },
    });
    try {
      await client.connect(transport);
      assert.equal((await client.listTools()).tools.length, 4);
    } finally {
      await client.close().catch(() => undefined);
    }
  } finally {
    await running.close();
  }
});

test("rejects an invalid profile before reporting readiness", async () => {
  const invalid = structuredClone(exampleProfile) as typeof exampleProfile;
  invalid.experience[0]!.highlights = [] as never[];
  (invalid.experience[0] as { company: string }).company = "";
  await assert.rejects(
    startMcpServer({ port: 0, profile: invalid }),
    /experience\.0\.company/,
  );
});
