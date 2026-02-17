// Copilot Studio uses a regional token endpoint instead of a shared secret.
// Token endpoint URL format:
// https://<env-geo>.environment.api.powerplatform.com/powervirtualagents/botsbyschema/<bot-schema>/directline/token?api-version=2022-03-01-preview

const COPILOT_TOKEN_ENDPOINT = process.env.COPILOT_TOKEN_ENDPOINT || "";
const DIRECT_LINE_BASE =
  process.env.DIRECT_LINE_BASE_URL || "https://directline.botframework.com";
const DIRECT_LINE_SECRET = process.env.DIRECT_LINE_SECRET || "";

export interface Conversation {
  conversationId: string;
  token: string;
  expires_in: number;
}

export interface Activity {
  type: string;
  id?: string;
  from: { id: string; name?: string };
  text?: string;
  timestamp?: string;
  channelData?: Record<string, unknown>;
}

export interface ActivitiesResponse {
  activities: Activity[];
  watermark: string;
}

async function directLineRequest(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<Response> {
  const authToken = token || DIRECT_LINE_SECRET;
  return fetch(`${DIRECT_LINE_BASE}/v3/directline${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

export async function startConversation(): Promise<Conversation> {
  const res = await directLineRequest("/conversations", { method: "POST" });
  if (!res.ok) {
    throw new Error(`Failed to start conversation: ${res.status}`);
  }
  return res.json();
}

export async function sendMessage(
  conversationId: string,
  token: string,
  text: string,
  userId: string = "contoso-user"
): Promise<string> {
  const res = await directLineRequest(
    `/conversations/${conversationId}/activities`,
    {
      method: "POST",
      body: JSON.stringify({
        type: "message",
        from: { id: userId },
        text,
      }),
    },
    token
  );
  if (!res.ok) {
    throw new Error(`Failed to send message: ${res.status}`);
  }
  const data = await res.json();
  return data.id;
}

export async function getActivities(
  conversationId: string,
  token: string,
  watermark?: string
): Promise<ActivitiesResponse> {
  const query = watermark ? `?watermark=${watermark}` : "";
  const res = await directLineRequest(
    `/conversations/${conversationId}/activities${query}`,
    { method: "GET" },
    token
  );
  if (!res.ok) {
    throw new Error(`Failed to get activities: ${res.status}`);
  }
  return res.json();
}

export async function generateToken(): Promise<{
  conversationId: string;
  token: string;
  expires_in: number;
}> {
  // Prefer Copilot Studio token endpoint over raw Direct Line secret
  if (COPILOT_TOKEN_ENDPOINT) {
    const res = await fetch(COPILOT_TOKEN_ENDPOINT, { method: "GET" });
    if (!res.ok) {
      throw new Error(`Failed to get Copilot Studio token: ${res.status}`);
    }
    return res.json();
  }

  const res = await directLineRequest("/tokens/generate", { method: "POST" });
  if (!res.ok) {
    throw new Error(`Failed to generate token: ${res.status}`);
  }
  return res.json();
}
