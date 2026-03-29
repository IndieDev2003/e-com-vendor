import swaggerJsdoc from "swagger-jsdoc";
import 'dotenv/config'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Product API",
      version: "1.0.0",
      description: "API documentation for Product Service",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT}/api`,
      },
    ],
  },
  apis: ["./routes/*.ts"], // path to your route files
};

export const swaggerSpec = swaggerJsdoc(options);
