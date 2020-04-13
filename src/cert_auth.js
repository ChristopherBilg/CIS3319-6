/* jshint esversion: 8 */

const readline = require('readline-sync');
const NodeRSA = require('node-rsa');
const crypto = require('crypto');

const idCA = 'ID-CA';
const idS = 'ID-Server';
const idC = 'ID-Client';
const req = 'memo';
const data = 'take cis3319 class this afternoon';
const clientHostname = '127.0.0.1';
const clientPort = 5000;
const tempDESKey1 = require('../key/tempDESKey1.json').key;
