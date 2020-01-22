const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Redis = require("ioredis");
const redis = new Redis({
    port: 6379, // Redis port
    host: "127.0.0.1", // Redis host
});
const app = express();
const TOPIC = 'TOPIC_TO_BE_SUBSCRIBED';
redis.on('connect', function () {
    console.log('Connected to Redis!');
    redis.subscribe(TOPIC);
});
redis.on('error', function (err) {
    console.error("Error connecting to redis", err);
});
redis.on("message", function (channel, message) {
    console.log("Receive message %s from channel %s", message, channel);
    sendEventsToAll(message);
});

// Middleware for GET /events endpoint
function eventsHandler(req, res, next) {
    // Mandatory headers and http status to keep connection open
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);
    const data = `data: ${JSON.stringify({})}\n\n`;
    res.write(data);
    // Generate an id based on timestamp and save res
    // object of client connection on clients list
    // Later we'll iterate it and send updates to each client
    const clientId = Date.now();
    const newClient = {
        id: clientId,
        res
    };
    clients.push(newClient);
    // When client closes connection we update the clients list
    // avoiding the disconnected one
    req.on('close', () => {
        console.log(`${clientId} Connection closed`);
        clients = clients.filter(c => c.id !== clientId);
    });
}

// Iterate clients list and use write res object method to send new nest
function sendEventsToAll(message) {
    clients.forEach(c => c.res.write(`data: ${message}\n\n`));
}

// Set cors and bodyParser middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
// Define endpoints
app.get('/events', eventsHandler);
app.get('/status', (req, res) => res.json({clients: clients.length}));
const PORT = 3000;
let clients = [];
// Start server on 3000 port
app.listen(PORT, () => console.log(`Swamp Events service listening on port ${PORT}`));
