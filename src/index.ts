/// <reference path="./types/express.d.ts" />
import express from "express";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { createClient } from "@supabase/supabase-js";
import { swaggerSpec, swaggerUiOptions } from "./config/swagger";
import "./docs/openapi";

dotenv.config();

const app = express();
app.use(express.json()); // Enable JSON body parsing
const port = process.env.PORT || 3000;

// Import central routes
import apiV1Router from "./routes";

// Swagger setup
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, swaggerUiOptions)
);

// API v1 routes
app.use("/api/v1", apiV1Router);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

app.get("/", (req, res) => {
  res.send("Hello from Supabase Auth API!");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
