const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configuración de Handlebars
const handlebars = require('express-handlebars');
app.engine('handlebars', handlebars.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Archivo JSON del historial
const chatFile = path.join(__dirname, 'data', 'chatHistory.json');

// Funciones para manejar el historial
const loadChatHistory = () => {
    if (!fs.existsSync(chatFile)) return [];
    const data = fs.readFileSync(chatFile, 'utf-8');
    return JSON.parse(data || '[]');
};

const saveChatHistory = (messages) => {
    fs.writeFileSync(chatFile, JSON.stringify(messages, null, 2));
};

// Ruta principal
app.get('/', (req, res) => {
    res.render('chat');
});

// WebSockets
io.on('connection', (socket) => {
    console.log('Nuevo usuario conectado');

    // Enviar historial al usuario conectado
    socket.emit('loadChat', loadChatHistory());

    // Recibir nuevo mensaje
    socket.on('newMessage', (msg) => {
        const messages = loadChatHistory();
        messages.push(msg);
        saveChatHistory(messages);
        io.emit('newMessage', msg); // Enviar a todos
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado');
    });
});

// Iniciar servidor
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Servidor activo en http://localhost:${PORT}`);
});
