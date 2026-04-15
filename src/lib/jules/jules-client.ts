export type JulesSession = {
  name: string;
  id: string;
  title?: string;
  state?: string;
  url?: string;
  createTime?: string;
  updateTime?: string;
};

type JulesCreateSessionInput = {
  baseUrl: string;
  apiKey: string;
  prompt: string;
  title: string;
  source: string;
  startingBranch: string;
  requirePlanApproval: boolean;
  automationMode?: "AUTO_CREATE_PR";
};

type JulesRequestOptions = {
  baseUrl: string;
  apiKey: string;
  method: "GET" | "POST";
  path: string;
  body?: Record<string, unknown>;
};

async function requestJules<T>(options: JulesRequestOptions): Promise<T> {
  const endpoint = `${options.baseUrl}${options.path}`;
  const response = await fetch(endpoint, {
    method: options.method,
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": options.apiKey,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const rawText = await response.text();
  const parsed = rawText.length > 0 ? (JSON.parse(rawText) as T) : ({} as T);
  if (!response.ok) {
    throw new Error(`Jules API request failed (${response.status}): ${rawText.slice(0, 2000)}`);
  }

  return parsed;
}

export async function createJulesSession(input: JulesCreateSessionInput) {
  const body: Record<string, unknown> = {
    prompt: input.prompt,
    title: input.title,
    sourceContext: {
      source: input.source,
      githubRepoContext: {
        startingBranch: input.startingBranch,
      },
    },
    requirePlanApproval: input.requirePlanApproval,
  };

  if (input.automationMode) {
    body.automationMode = input.automationMode;
  }

  return requestJules<JulesSession>({
    baseUrl: input.baseUrl,
    apiKey: input.apiKey,
    method: "POST",
    path: "/v1alpha/sessions",
    body,
  });
}

export async function listJulesSources(input: { baseUrl: string; apiKey: string; pageSize?: number }) {
  const pageSize = input.pageSize ?? 20;
  return requestJules<{ sources?: Array<{ name: string; id?: string }> }>({
    baseUrl: input.baseUrl,
    apiKey: input.apiKey,
    method: "GET",
    path: `/v1alpha/sources?pageSize=${pageSize}`,
  });
}

export async function listJulesSessions(input: { baseUrl: string; apiKey: string; pageSize?: number }) {
  const pageSize = input.pageSize ?? 20;
  return requestJules<{ sessions?: JulesSession[] }>({
    baseUrl: input.baseUrl,
    apiKey: input.apiKey,
    method: "GET",
    path: `/v1alpha/sessions?pageSize=${pageSize}`,
  });
}

