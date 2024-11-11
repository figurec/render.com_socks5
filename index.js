var http = require("http");
var port = process.env.PORT || process.env.VCAP_APP_PORT || 8090;
var server = http.createServer();

server.on("request", (req, res) => {
  res.on("error", (err) => {
    console.error(err);
  });

  if (req.url == "/now") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.write(JSON.stringify({ now: new Date() }));
    res.end();
  } else {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.write("example page\n");
    res.end("Hello World\n");
  }
});

server.listen(port);
console.log("http server listening on %d", port);

const dns = require('dns');
var net = require("net");
var WebSocketServer = require("ws").Server;
var wss = new WebSocketServer({ server: server });

wss.on("connection", function (ws) {
  //console.log("ws:connection");
  
  var client = new net.Socket();
  var addr;
  //var addr = { host: "localhost", port: 8090 };

  client.on("connect", function () {
    //console.log("client:connect:" + addr.host);
    ws.send(addr.ipv4);
  });

  client.on("error", function (ex) {
    console.log("Ошибка сокета " + ex);
  });

  client.on("data", function (data) {
    //console.log("client:data");
    //console.log(data.toString());
    if (ws.readyState == ws.OPEN) {
      ws.send(data);
    }
  });

  client.on("close", function () {
    //console.log("client:close");
    ws.close();
    client.destroy(); // kill client after server's response
  });

  //\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

  ws.on("message", function incoming(message, isBinary) {
    //console.log("ws:message");
    //console.log(isBinary);
    //if (typeof(message) == "object"){
    if (isBinary == true){
      //console.log("ws:message:object");
      //console.log(message);
      client.write(message);
    }
    //if (typeof(message) == "string"){
    if (isBinary == false){
      console.log("ws:message:string: " + message);
      addr = JSON.parse(message);
      if (addr.type == "tcp") {
        dns.lookup(addr.host, 4, (err, address, family) => {
          if (err) {
            ws.close();
            return;
          } //throw err;
          //console.log("dns: " + address);
          addr.ipv4 = address;
          client.connect(addr.port, addr.ipv4);
        });
        //client.connect(addr.port, addr.host);
      }
      if (addr.type == "connect") {
      }
      //client.connect(addr);
    }
  });

  ws.on("close", function () {
    //console.log("ws:close");
    //ws.destroy();
    client.destroy();
  });

  ws.on("error", function (ex) {
    console.log("Ошибка вебоокета " + ex);
  });
});
