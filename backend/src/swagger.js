const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "School ERP Backend API",
      version: "1.0.0",
      description: "Backend APIs for multi-tenant school ERP system",
    },
    servers: [
      {
        url: "http://localhost:8000/api/v1",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/modules/**/*.js"],
};

module.exports = swaggerJSDoc(options);