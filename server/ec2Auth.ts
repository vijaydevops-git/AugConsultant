import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Simple auth system for EC2 deployment without Replit dependencies
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // HTTP for EC2
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Simple middleware to simulate authenticated user for EC2
  app.use((req, res, next) => {
    if (!req.session) {
      req.session = {} as any;
    }
    
    // For EC2 deployment, simulate a test user with proper session structure
    const mockUser = {
      id: 'ec2-admin',
      email: 'admin@ec2.local',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      claims: {
        sub: 'ec2-admin',
        email: 'admin@ec2.local',
        first_name: 'Admin',
        last_name: 'User'
      }
    };
    
    (req as any).user = mockUser;
    (req.session as any).userId = 'ec2-admin';
    
    next();
  });

  // Simple auth endpoints
  app.get("/api/login", (req, res) => {
    res.redirect("/");
  });

  app.get("/api/logout", (req, res) => {
    req.session?.destroy(() => {
      res.redirect("/");
    });
  });

  app.get("/api/auth/user", (req, res) => {
    res.json((req as any).user);
  });
}