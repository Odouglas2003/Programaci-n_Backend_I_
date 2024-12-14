const socket = io();
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

// Cargar historial de mensajes
socket.on('loadChat', (messages) => {
    messages.forEach(displayMessage);
});

// Escuchar mensajes nuevos
socket.on('newMessage', (msg) => {
    displayMessage(msg);
});

// Enviar mensaje al servidor
sendBtn.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message) {
        const msg = { text: message, date: new Date().toLocaleTimeString() };
        socket.emit('newMessage', msg);
        messageInput.value = '';
    }
});

// Función para mostrar un mensaje
function displayMessage(msg) {
    const messageElement = document.createElement('div');
    messageElement.textContent = `[${msg.date}] ${msg.text}`;
    messagesDiv.appendChild(messageElement);
}
