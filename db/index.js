const mysql = require('mysql2');
const dbconfig = require('../config/db');

const pool = mysql.createPool(dbconfig);

const db = pool.promise();

module.exports = db;