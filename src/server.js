/* jshint esversion: 8 */

const net = require('net');
const readline = require('readline-sync');
const NodeRSA = require('node-rsa');
const crypto = require('crypto');

const idCA = 'ID-CA';
const idS = 'ID-Server';
const idC = 'ID-Client';
const req = 'memo';
const applicationData = 'take cis3319 class this afternoon';
const hostname = '127.0.0.1';
const clientPort = 5000;
const serverPort = 5001;
const certAuthPort = 5002;
const tempDESKey1 = require('../key/tempDESKey1.json').key;
const kSess = require('../key/kSess.json').key;
const Cryptr = require('cryptr');

const encrypt = (text, key) => {
  return new Cryptr(key).encrypt(text);
};

const decrypt = (text, key) => {
  return new Cryptr(key).decrypt(text);
};

const getApplicationServerRegistration = new Promise((resolve, reject) => {
  const socket = new net.Socket();

  socket.connect(certAuthPort, hostname, () => {
    console.log('Successful connection has been made with the CA (certificate authority).');

    const message = {
      tempDESKey1: tempDESKey1,
      idS, idS,
      TS1: new Date().getTime(),
      exit: true,
    };
    socket.write(JSON.stringify(message));
  });

  socket.on('data', (data) => {
    console.log(`Server received data: ${data}`);
    data = JSON.parse(data);
    if (data.exit === true) {
      socket.destroy();
    }

    resolve(data);
  });

  socket.on('close', () => {
    console.log('Connection with the CA (certificate authority) has been closed.');
  });

  socket.on('error', (error) => {
    console.log('Error:', error);
  });
});

const handleSessionKey1 = new Promise((resolve, reject) => {
  console.log('Waiting for the client to connect and request a session key. (1)');
  const server = net.createServer((socket) => {
    const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`Client connected: ${remoteAddress}`);

    socket.on('data', (data) => {
      console.log(`${remoteAddress} sent the message: ${data}`);

      data = JSON.parse(data);

      const pkS = 3;
      const message = {
        pkS: pkS,
        certS: {
          idS: idS,
          idCA: idCA,
          pkS: pkS,
        },
        TS4: new Date().getTime(),
        exit: true,
      };
      socket.write(JSON.stringify(message));
    });

    socket.on('close', () => {
      console.log(`Client disconnected: ${remoteAddress}`);
    });

    socket.on('error', (error) => {
      console.log('Error:', error);
    });
  });

  server.listen(serverPort, hostname, () => {
    console.log(`The server S is listening on ${hostname}:${serverPort}`);
  });
});

const handleSessionKey2 = new Promise((resolve, reject) => {
  console.log('Waiting for the client to connect and request a session key. (2)');
  const server = net.createServer((socket) => {
    const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`Client connected: ${remoteAddress}`);

    socket.on('data', (data) => {
      console.log(`${remoteAddress} sent the message: ${data}`);

      data = JSON.parse(data);

      const message = {
        kSess: kSess,
        lifetimeSess: 86400000, // 1 day
        idC: idC,
        TS6: new Date().getTime(),
        exit: true,
      };
      socket.write(JSON.stringify(message));
    });

    socket.on('close', () => {
      console.log(`Client disconnected: ${remoteAddress}`);
    });

    socket.on('error', (error) => {
      console.log('Error:', error);
    });
  });

  server.listen(serverPort+3, hostname, () => {
    console.log(`The server S is listening on ${hostname}:${serverPort}`);
  });
});

const handleApplicationData = new Promise((resolve, reject) => {
  console.log('Waiting for the client to connect and request application data.');
  const server = net.createServer((socket) => {
    const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`Client connected: ${remoteAddress}`);

    socket.on('data', (data) => {
      console.log(`${remoteAddress} sent the message: ${data}`);
      data = decrypt(data, kSess);
      console.log(`${remoteAddress} sent the message: ${data}`);

      data = JSON.parse(data);

      const message = {
        data: applicationData,
        TS8: new Date().getTime(),
        exit: true,
      };
      socket.write(encrypt(JSON.stringify(message), kSess));
    });

    socket.on('close', () => {
      console.log(`Client disconnected: ${remoteAddress}`);
    });

    socket.on('error', (error) => {
      console.log('Error:', error);
    });
  });

  server.listen(serverPort+2, hostname, () => {
    console.log(`The server S is listening on ${hostname}:${serverPort}`);
  });
});

readline.question('Press ENTER to get an application server registration from the certificate authority.');
getApplicationServerRegistration.then((data) => {
  console.log('Data - Certificate Authority:', data);
}).then(() => {
  return handleSessionKey1;
}).then((data) => {
  console.log('Data - Session Key Created (1):', data);
}).then(() => {
  return handleSessionKey2;
}).then((data) => {
  console.log('Data - Session Key Created (2):', data);
}).then(() => {
  return handleApplicationData;
}).then((data) => {
  console.log('Data - Application Data:', data);
}).catch((error) => {
  console.log('Unexpected error in Promise chain:', error);
});
