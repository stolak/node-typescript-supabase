import { JwtPayload } from "jsonwebtoken";
interface User {
  id: string | undefined;
  name: string | undefined;
  email: string | undefined;
  roles: string[];
}

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}
