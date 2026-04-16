import type { ApiRequest } from "@/interviews/types";

export interface CompiledRoute {
  method: string;
  regex: RegExp;
  handler: (req: ApiRequest) => Promise<unknown>;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function compilePath(path: string): RegExp {
  const pattern = path
    .split("/")
    .map((seg) =>
      seg.startsWith(":") ? `(?<${seg.slice(1)}>[^/]+)` : escapeRegex(seg)
    )
    .join("/");
  return new RegExp(`^${pattern}$`);
}

export function matchRoute(
  routes: CompiledRoute[],
  method: string,
  pathname: string
): { handler: CompiledRoute["handler"]; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method) continue;
    const match = route.regex.exec(pathname);
    if (match) {
      return { handler: route.handler, params: match.groups ?? {} };
    }
  }
  return null;
}
