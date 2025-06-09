import { getToken } from "@/components/chat/chat-actions";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => {
    //@ts-ignore
    return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16);
  }
  );
}

type CallBackendOptions = {
  endpoint: string;
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  userId: string;
};

export async function callBackend<T = any>(options: CallBackendOptions): Promise<T> {
  const backendUrl = process.env.PRIVATE_BACKEND_URL || process.env.PUBLIC_BACKEND_URL;

  if (!backendUrl) {
    throw new Error("PRIVATE_BACKEND_URL is not set!");
  }

  const token = await getToken(options.userId);

  const { endpoint, method = "GET", body, headers = {} } = options;

  const resp = await fetch(
    `${backendUrl}${endpoint}`,
    {
      method,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }
  );

  if (!resp.ok) {
    throw new Error(`Backend request failed: ${resp.status} ${resp.statusText}`);
  }

  return resp.json();
}