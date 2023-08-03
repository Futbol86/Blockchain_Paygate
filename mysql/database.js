const util = require('util')
var mysql = require('mysql');

// const pool = mysql.createPool({
//     connectionLimit : 100, //important
//     host     : 'localhost',
//     user     : 'root',
//     password : 'root@123',
//     database : 'mlm_ges',
//     debug    :  false
// });

const pool = mysql.createPool({
    connectionLimit : 100, //important
    host     : '206.189.33.52',
    user     : 'ges',
    password : '1ABCabc@123$%^&*()',
    database : 'mlm_ges',
    debug    :  false
});


pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.')
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.')
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.')
        }
    }
    if (connection) connection.release()
    return
})

// Promisify for Node.js async/await.
pool.query = util.promisify(pool.query);
module.exports = pool