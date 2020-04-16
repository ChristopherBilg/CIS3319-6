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
const tempDESKey2 = require('../key/tempDESKey2.json').key;
const kSess = require('../key/kSess.json').key;
const Cryptr = require('cryptr');

const encrypt = (text, key) => {
  return new Cryptr(key).encrypt(text);
};

const decrypt = (text, key) => {
  return new Cryptr(key).decrypt(text);
};

const getSessionKeyFromServerS1 = new Promise((resolve, reject) => {
  const socket = new net.Socket();

  socket.connect(serverPort, hostname, () => {
    console.log('Successful connection has been made with the server S. (round 1)');

    const message = {
      idS: idS,
      TS3: new Date().getTime(),
    };
    socket.write(JSON.stringify(message));
  });

  socket.on('data', (data) => {
    console.log(`Client received data: ${data}`);
    data = JSON.parse(data);
    if (data.exit === true) {
      socket.destroy();
    }

    resolve(data);
  });

  socket.on('close', () => {
    console.log('Connection with the server S has been closed. (round 1)');
  });

  socket.on('error', (error) => {
    console.log('Error:', error);
  });
});

const getSessionKeyFromServerS2 = new Promise((resolve, reject) => {
  const socket = new net.Socket();

  socket.connect(serverPort+3, hostname, () => {
    console.log('Successful connection has been made with the server S. (round 2)');

    const message = {
      tempDESKey2: tempDESKey2,
      idC: idC,
      ipC: hostname,
      portC: clientPort,
      TS5: new Date().getTime(),
    };
    socket.write(encrypt(JSON.stringify(message), tempDESKey2));
  });

  socket.on('data', (data) => {
    console.log(`Client received data: ${data}`);
    data = decrypt(data, tempDESKey2);
    console.log(`Client received data: ${data}`);

    data = JSON.parse(data);
    if (data.exit === true) {
      socket.destroy();
    }

    resolve(data);
  });

  socket.on('close', () => {
    console.log('Connection with the server S has been closed. (round 2)');
  });

  socket.on('error', (error) => {
    console.log('Error:', error);
  });
});

const getApplicationDataFromServerS = new Promise((resolve, reject) => {
  const socket = new net.Socket();

  socket.connect(serverPort+2, hostname, () => {
    console.log('Successful connection has been made with the server S. (application data phase)');

    const message = {
      req: req,
      TS7: new Date().getTime(),
    };
    socket.write(encrypt(JSON.stringify(message), kSess));
  });

  socket.on('data', (data) => {
    console.log(`Client received data: ${data}`);
    data = decrypt(data, kSess);
    console.log(`Client received data: ${data}`);

    data = JSON.parse(data);
    if (data.exit === true) {
      socket.destroy();
    }

    resolve(data);
  });

  socket.on('close', () => {
    console.log('Connection with the server S has been closed. (application data phase)');
  });

  socket.on('error', (error) => {
    console.log('Error:', error);
  });
});

readline.question('Press ENTER to get a session key from server S.');
getSessionKeyFromServerS1.then((data) => {
  console.log('Data - Session Key Round 1 Obtained:', data);
}).then(() => {
  return getSessionKeyFromServerS2;
}).then((data) => {
  console.log('Data - Session Key Round 2 Obtained:', data);
}).then(() => {
  return getApplicationDataFromServerS;
}).then((data) => {
  console.log('Data - Application Data:', data);
}).catch((error) => {
  console.log('Unexpected error in Promise chain:', error);
});
