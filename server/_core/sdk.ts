import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import { webcrypto } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import type { Request } from "express";
import * as db from "../db";
import { ENV } from "./env";

if (!(globalThis as any).crypto) {
  (globalThis as any).crypto = webcrypto;
}

export type SessionPayload = {
  userId: number;
  email: string;
  name: string;
};

class SDKServer {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) return new Map<string, string>();
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    const secret = ENV.cookieSecret || "change-me-in-production";
    return new TextEncoder().encode(secret);
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(cookieValue: string | undefined | null): Promise<SessionPayload | null> {
    if (!cookieValue) return null;

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });

      const userId = Number(payload.userId);
      const email = typeof payload.email === "string" ? payload.email : "";
      const name = typeof payload.name === "string" ? payload.name : "";

      if (!userId || !email) return null;
      return { userId, email, name };
    } catch {
      return null;
    }
  }

  async authenticateRequest(req: Request) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const user = await db.getUserById(session.userId);
    if (!user) {
      throw ForbiddenError("User not found");
    }

    await db.touchUserLastSignedIn(user.id);
    return user;
  }
}

export const sdk = new SDKServer();
