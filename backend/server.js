require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// --- Initializare Conexiune DB ---
// Prin simpla 'chemare' a fișierului, forțăm pornirea conexiunii la DB
require('./config/db');

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Configurare Swagger ---
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WebPanel API',
      version: '1.0.0',
      description: 'API Documentation for the Modern Web Hosting Control Panel',
    },
    servers: [
      {
        url: `http://localhost:${process.env.BACKEND_PORT || 4000}`,
      },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: "Enter 'Bearer' [space] and then your token in the text input below.\n\nExample: 'Bearer 12345abcdef'"
            }
        }
    },
    security: [{
        bearerAuth: []
    }]
  },
  apis: ['./routes/*.js'], // Calea către fișierele cu rute
};
const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


// --- Rute API ---
app.get('/api', (req, res) => {
    res.json({ message: 'Welcome to the WebPanel API! View documentation at /api/docs' });
});

// Rute de autentificare
app.use('/api/auth', require('./routes/auth'));

// Rute pentru domenii
app.use('/api/domains', require('./routes/domains'));

// O rută protejată de test
const authMiddleware = require('./middleware/authMiddleware');
const User = require('./models/User');

app.get('/api/profile', authMiddleware, async (req, res) => {
    try {
        // req.user este adăugat de authMiddleware
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// --- Pornire Server ---
const PORT = process.env.BACKEND_PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend server is running on port ${PORT}.`);
  console.log(`✅ API Documentation available at http://localhost:${PORT}/api/docs`);
});
