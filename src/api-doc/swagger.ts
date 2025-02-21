import swaggerJSDoc from "swagger-jsdoc"
import path from "path";



const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Personal Finance Management API',
    version: '1.0.0',
    description: 'API documentation for personal finance management application',
  },
  servers: [
    {
      url: `http://localhost:3000`,
      description: 'local host',
    }
  ],
};

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [path.join(__dirname, './*.yaml')],
};
export const swaggerDoc = swaggerJSDoc(swaggerOptions);