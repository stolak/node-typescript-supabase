import swaggerJsdoc from "swagger-jsdoc";

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
        url: "http://localhost:3000",
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
  apis: ["src/**/*.ts"],
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
