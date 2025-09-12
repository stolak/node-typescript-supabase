import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { supabase } from "../supabaseClient";
export async function authenticateSupabaseToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    // const payload = jwt.decode(token) as JwtPayload;
    // if (!payload) throw new Error("Invalid token");
    const { data, error } = await supabase.auth.getUser(token);
    if (error) {
      console.error("Supabase auth error:", error);
      throw error;
    }
    // await supabase.auth.admin.updateUserById(data.user.id, {
    //   app_metadata: { roles: ["admin", "editor"] },
    // });
    req.user = data.user;

    // req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function authorize(requiredRole: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    console.log(req.user);
    const roles: string[] = req.user?.app_metadata?.roles || [];
    if (!roles.some((role) => requiredRole.includes(role))) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
