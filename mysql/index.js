var mysql = require('mysql');
var pool = require('./database');

const queryRow = async(tableName, fields, values) => {
    var field_query = ""
    for(var i = 0; i < fields.length; i++) {
        if(i === fields.length -1)
            field_query += "??"
        else 
            field_query += "?? "
    }

    var value_query = ""
    for(var i = 0; i < values.length; i++) {
        if(i === values.length -1)
            value_query += "?"
        else 
            value_query += "? "
    }

    let selectQuery = 'SELECT * FROM ?? WHERE ' + field_query + ' = ' + value_query;
    let query = mysql.format(selectQuery, [tableName, ...fields, ...values]);

    let result = await pool.query(query);
    return result;
}

const queryData = async(query) => {
    let result = await pool.query(query);
    return result;
}

const addRow = async(tableName, fields, values) => {
    var field_query = ""
    for(var i = 0; i < fields.length; i++) {
        if(i === fields.length -1)
            field_query += "??"
        else 
            field_query += "??,"
    }

    var value_query = ""
    for(var i = 0; i < values.length; i++) {
        if(i === values.length -1)
            value_query += "?"
        else 
            value_query += "?,"
    }

    let insertQuery = 'INSERT INTO ?? (' + field_query + ') VALUES (' + value_query + ')';
    let query = mysql.format(insertQuery, [tableName, ...fields, ...values]);

    let result = await pool.query(query);
    return result;
}

const updateRow = async(tableName, set_name_1, set_value_1, condition_name_1, condition_value_1) => {
    let updateQuery = 'UPDATE ?? SET ?? = ? WHERE ?? = ?';
    let query = mysql.format(updateQuery, [tableName, set_name_1, set_value_1, condition_name_1, condition_value_1]);
    let result = await pool.query(query);
    return result;
}

function deleteRow(userName) {
    let deleteQuery = 'DELETE from ?? where ?? = ?';
    let query = mysql.format(deleteQuery, ["user", "name", data.name]);
    pool.query(query, (err, response) => {
        if(err) {
            console.log(err)
            return;
        }
        // rows added
    })
}

module.exports = {
    queryRow: queryRow,
    addRow: addRow,
    updateRow: updateRow,
    deleteRow: deleteRow,
    queryData: queryData,
}