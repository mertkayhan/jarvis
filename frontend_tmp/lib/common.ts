"use server";

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
    throw new Error("Backend URL is not set!");
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

let cachedToken: string | null = null;
let tokenExpiryTime = 0;

export async function getToken(userId: string) {
  const secret = process.env.AUTH0_SECRET;
  if (!secret) {
    throw new Error("AUTH0_SECRET is not set!");
  }
  if (cachedToken && Math.floor(Date.now()) < tokenExpiryTime) {
    return cachedToken;
  } else {
    const expiration = Math.floor(Date.now() / 1000) + 3600;
    tokenExpiryTime = expiration - 60;
    const claims = {
      sub: userId,
      role: "user",  // TODO:
      iat: Math.floor(Date.now() / 1000),
      aud: process.env.AUTH0_API_AUDIENCE,
      exp: expiration,
      iss: process.env.APP_BASE_URL,
      jti: crypto.randomUUID(),
      nbf: Math.floor(Date.now() / 1000) - 1,
    };
    var jwt = require('jsonwebtoken');
    const token = jwt.sign(claims, secret, { algorithm: "HS256" });
    cachedToken = token;
    return token;
  }
}

export async function getWSUrl() {
  const url = process.env.PUBLIC_BACKEND_URL;
  if (!url) {
    throw new Error('PUBLIC_BACKEND_URL is not set!');
  }
  return url;
}
