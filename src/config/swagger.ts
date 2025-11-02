import swaggerJsdoc from "swagger-jsdoc";
import dotenv from "dotenv";
import glob from "glob";
dotenv.config();
const excludeEnv = process.env.EXCLUDE_ROUTES;
console.log("EXCLUDE_ROUTES env variable:", excludeEnv);
const excludeList = excludeEnv
  ? excludeEnv.split(",").map((s) => s.trim())
  : ["src/routes/do-not-exclude.ts"];
console.log("Excluding the following files from Swagger docs:", excludeList);
const files = glob
  .sync("src/**/*.ts", { nodir: true })
  .filter((f) => !excludeList.some((ex) => f.includes(ex)));

export const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Supabase Auth API",
      version: "1.0.0",
      description: "API documentation for Supabase Auth API",
    },
    servers: [
      {
        url: process.env.SWAGGER_SERVER_URL || "http://localhost:3000",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your Supabase JWT token",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: files, // ["src/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

export const swaggerUiOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: "none",
    filter: true,
    showRequestHeaders: true,
    tryItOutEnabled: true,
  },
};
