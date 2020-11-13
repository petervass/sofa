var app = require('express')();
options={
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
   }
var http = require('http').createServer(app);
var io = require('socket.io')(http, options);

app.get('/', (req, res) => {
  res.send('<h1>Sofa socket.io server.</h1>');
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});


io.on('connection', socket => {
  socket.on('sync', (data) => {
    console.log(data)
    socket.broadcast.emit('sync', data)
  })

  socket.on('clock', (data, resp) => {
    resp(Date.now())
  })
})
