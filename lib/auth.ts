// import jwt from "jsonwebtoken";
// import bcrypt from "bcryptjs";
// import { NextRequest } from "next/server";

// const JWT_SECRET = process.env.JWT_SECRET!;

// export async function hashPassword(password: string) {
//   return bcrypt.hash(password, 12); // 12 = cost factor, ~250ms
// }

// export async function comparePassword(password: string, hash: string) {
//   return bcrypt.compare(password, hash); // timing-safe comparison
// }

// export function generateToken(payload: { userId: string; email: string; role: string }) {
//   return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
// }

// export function verifyToken(token: string) {
//   try {
//     return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
//   } catch {
//     return null; // Return null instead of throwing — callers handle this
//   }
// }

// export function verifyAuth(request: NextRequest) {
//   // Check Authorization header (for API clients)
//   const authHeader = request.headers.get("authorization");
//   if (authHeader?.startsWith("Bearer ")) {
//     return verifyToken(authHeader.substring(7));
//   }

//   // Check HTTP-only cookie (for browser)
//   const cookieToken = request.cookies.get("auth-token")?.value;
//   if (cookieToken) return verifyToken(cookieToken);

//   return null;
// }

// export function requireRole(auth: ReturnType<typeof verifyToken>, roles: string[]) {
//   if (!auth) return { error: "Unauthorized", status: 401 };
//   if (!roles.includes(auth.role)) return { error: "Forbidden", status: 403 };
//   return null;
// }



import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET!;

// ── Password ─────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── JWT ───────────────────────────────────────────────────

export function generateToken(payload: {
  userId: string;
  email: string;
  role: string;
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };
  } catch {
    return null;
  }
}

// ── Request Auth ──────────────────────────────────────────

export function verifyAuth(request: NextRequest) {
  // Check Authorization header first (for API clients)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return verifyToken(authHeader.substring(7));
  }

  // Fall back to HTTP-only cookie (for browser)
  const cookieToken = request.cookies.get("auth-token")?.value;
  if (cookieToken) return verifyToken(cookieToken);

  return null;
}

// ── Role Guard ────────────────────────────────────────────

export function requireRole(
  auth: ReturnType<typeof verifyToken>,
  roles: string[]
): { error: string; status: number } | null {
  if (!auth) return { error: "Unauthorized", status: 401 };
  if (!roles.includes(auth.role)) return { error: "Forbidden", status: 403 };
  return null;
}
