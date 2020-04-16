/* jshint esversion: 8 */

const net = require('net');
const readline = require('readline-sync');
const NodeRSA = require('node-rsa');
const crypto = require('crypto');

const idCA = 'ID-CA';
const idS = 'ID-Server';
const idC = 'ID-Client';
const req = 'memo';
const data = 'take cis3319 class this afternoon';
const hostname = '127.0.0.1';
const clientPort = 5000;
const serverPort = 5001;
const certAuthPort = 5002;
const tempDESKey1 = require('../key/tempDESKey1.json').key;
const Cryptr = require('cryptr');

const encrypt = (text, key) => {
  return new Cryptr(key).encrypt(text);
};

const decrypt = (text, key) => {
  return new Cryptr(key).decrypt(text);
};

console.log('Waiting for the server to connect and request a application server registration.');
const server = net.createServer((socket) => {
  const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log(`Server connected: ${remoteAddress}`);

  socket.on('data', (data) => {
    console.log(`${remoteAddress} sent the message: ${data}`);
    data = decrypt(data, tempDESKey1);
    console.log(`${remoteAddress} sent the message: ${data}`);

    data = JSON.parse(data);

    const pkS = 3;
    const skS = 7;
    const message = {
      pkS: pkS,
      skS: skS,
      certS: {
        idS: idS,
        idCA: idCA,
        pkS: pkS,
      },
      idS: idS,
      TS2: new Date().getTime(),
      exit: true,
    };
    socket.write(encrypt(JSON.stringify(message), tempDESKey1));
  });

  socket.on('close', () => {
    console.log(`Server disconnected: ${remoteAddress}`);
  });

  socket.on('error', (error) => {
    console.log('Error:', error);
  });
});

server.listen(certAuthPort, hostname, () => {
  console.log(`The Certificate Authority server is listening on ${hostname}:${certAuthPort}`);
});
