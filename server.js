const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const clients = new Map(); // Mapeo de usuarios y conexiones
const messagesHistory = new Map(); // Almacena el historial de mensajes entre usuarios

wss.on('connection', (ws) => {
    let username = null;

    ws.on('message', (data) => {
        const parsedData = JSON.parse(data);

        if (parsedData.type === 'register') {
            username = parsedData.username;
            clients.set(username, ws);
            broadcastUserList(); // Actualiza la lista de usuarios
        }

        if (parsedData.type === 'message') {
            const { to, from, message } = parsedData;

            // Guarda el mensaje en el historial
            const conversationKey = [from, to].sort().join('-'); // Clave única para cada par de usuarios
            if (!messagesHistory.has(conversationKey)) {
                messagesHistory.set(conversationKey, []);
            }
            messagesHistory.get(conversationKey).push({ from, message });

            // Envía el mensaje al receptor, si está conectado
            const recipient = clients.get(to);
            if (recipient && recipient.readyState === WebSocket.OPEN) {
                recipient.send(JSON.stringify({ type: 'message', from, message }));
            }
        }

        if (parsedData.type === 'getHistory') {
            const { to, from } = parsedData;
            sendMessageHistory(ws, to, from); // Envía el historial actualizado
        }
    });

    ws.on('close', () => {
        // Elimina al cliente desconectado
        for (const [username, socket] of clients.entries()) {
            if (socket === ws) {
                clients.delete(username);
                break;
            }
        }
        broadcastUserList(); // Actualiza la lista de usuarios
    });

    // Función para enviar la lista de usuarios a todos los clientes
    function broadcastUserList() {
        const users = Array.from(clients.keys());
        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'updateUsers', users }));
            }
        });
    }

    // Envía el historial de mensajes cuando un cliente se conecta a un usuario
    function sendMessageHistory(ws, to, from) {
        const conversationKey = [from, to].sort().join('-');
        if (messagesHistory.has(conversationKey)) {
            ws.send(JSON.stringify({ type: 'messageHistory', messages: messagesHistory.get(conversationKey) }));
        }
    }
});
