const bcrypt = require('bcrypt');
const saltRounds = 5;
const shordid = require('shortid');

const mysql = require('mysql');
var dateFormat = require('dateformat');

var axios = require('axios');
var moment = require("moment");
var fs = require('fs');
const path = require('path')
const uuid = require('uuid');
const csv = require('csv-parser');

const tron_f = require('../blockchain/custom-libs/tron_wallet');

var md5 = require('md5');
var security = require('../common/security');
var config   = require('../common/config');
var pool = require('../mysql/database');
const mysql_function = require('../mysql');

var { encrypt, decrypt } = require('../common/security');

module.exports = (router) => {
    router.get(`/admin/partners`, async (req, res) => {
        let { name, callbackUrl, fromDate, toDate, limit = 10, offset = 0 } = req.query;
        var token = null;

        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            token = req.headers.authorization.split(' ')[1];
        }

        if(token === null || token === undefined || token.length === 0 || token && token !== config.SECRET_KEY) {
            return res.status(200).send({
                status: 400,
                msg: "Invalid Token",
            });
        }

        var query, result = [], totalCount = 0;

        if(name) {
            if(Boolean(fromDate) && Boolean(toDate)) {
                var from_date_to_unix = new moment(fromDate).unix();
                var to_date_to_unix = new moment(toDate).unix();

                query = 'select * from partners where name = "' 
                        + name + '" and UNIX_TIMESTAMP(create_date) >= ' 
                        + from_date_to_unix + ' and UNIX_TIMESTAMP(create_date) <= ' 
                        + to_date_to_unix + ' order by id desc limit ' + limit + ' offset ' + offset;
                result = await mysql_function.queryData(query);

                query = 'select count(*) as totalCount from partners where name = "' 
                        + name + '" and UNIX_TIMESTAMP(create_date) >= ' 
                        + from_date_to_unix + ' and UNIX_TIMESTAMP(create_date) <= ' + to_date_to_unix;
                totalCount = await mysql_function.queryData(query);

            } else {
                query = 'select * from partners where name = "' 
                        + name + '" order by id desc limit ' + limit + ' offset ' + offset;
                result = await mysql_function.queryData(query);

                query = 'select count(*) as totalCount from partners where name = "' + name + '"';
                totalCount = await mysql_function.queryData(query);
            }
        } else {
              if(Boolean(fromDate) && Boolean(toDate)) {
                var from_date_to_unix = new moment(fromDate).unix();
                var to_date_to_unix = new moment(toDate).unix();

                query = 'select * from partners where UNIX_TIMESTAMP(create_date) >= ' 
                        + from_date_to_unix + ' and UNIX_TIMESTAMP(create_date) <= ' 
                        + to_date_to_unix + ' order by id desc limit ' + limit + ' offset ' + offset;
                result = await mysql_function.queryData(query);

                query = 'select count(*) as totalCount from partners where UNIX_TIMESTAMP(create_date) >= ' 
                        + from_date_to_unix + ' and UNIX_TIMESTAMP(create_date) <= ' + to_date_to_unix;
                totalCount = await mysql_function.queryData(query);
            } else {
                query = 'select * from partners order by id desc limit ' + limit + ' offset ' + offset;
                result = await mysql_function.queryData(query);

                query = 'select count(*) as totalCount from partners';
                totalCount = await mysql_function.queryData(query);
            }
        }

        return res.status(200).send({
            status: 1,
            msg: 'success',
            data: {
                data: result,
                totalCount: totalCount && totalCount[0].totalCount
            }

        });
    });


    // Update Partners
    router.put(`/admin/partners`, async (req, res) => {
        const { partnerCode, callbackUrl, iPWithdraw } = req.body;

        console.log('req.body', req.body)
        if(!Boolean(partnerCode)) {
            return res.status(200).send({
                status: 300,
                msg: "Please fill parameter: partnerCode",
            });
        }

        if(Boolean(callbackUrl)) {
            let query = "update partners set callbackUrl = '" + callbackUrl + "' where partnerCode = '" + partnerCode + "'";
            console.log('query', query)
            var result = await mysql_function.queryData(query);

            return res.status(200).send({
                status: 1,
                 msg: 'success',
                data: result
            });
        } else if(Boolean(iPWithdraw)) {
            let query = "update partners set iPWithdraw = '" + iPWithdraw + "' where partnerCode = '" + partnerCode + "'"; 
        
            var result = await mysql_function.queryData(query);
            return res.status(200).send({
                status: 1,
                 msg: 'success',
                data: result
            });
        } else {
            return res.status(200).send({
                status: 0,
                msg: 'no find paramter',
                data: null,
            });
        }
    });

    router.get(`/admin/wallets`, async (req, res) => {
        let { partnerCode, fromDate, toDate, limit = 10, offset = 0 } = req.query;
        console.log('req.query', req.query)
        var token = null;

        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            token = req.headers.authorization.split(' ')[1];
        }

        if(token === null || token === undefined || token.length === 0 || token && token !== config.SECRET_KEY) {
            return res.status(200).send({
                status: 400,
                msg: "Invalid Token",
            });
        }

        var query, result = [], totalCount = 0;

        if(partnerCode) {
            if(Boolean(fromDate) && Boolean(toDate)) {
                var from_date_to_unix = new moment(fromDate).unix();
                var to_date_to_unix = new moment(toDate).unix();

                query = 'select address, partnerCode, token, network, create_date from cyber_media_wallet where partnerCode = "' 
                       + partnerCode + '" and UNIX_TIMESTAMP(create_date) >= ' 
                       + from_date_to_unix + ' and UNIX_TIMESTAMP(create_date) <= '
                       + to_date_to_unix + ' order by id desc limit ' + limit + ' offset ' + offset;
                result = await mysql_function.queryData(query);

                query = 'select count(*) as totalCount from cyber_media_wallet where partnerCode = "' 
                      + partnerCode + '" and UNIX_TIMESTAMP(create_date) >= ' 
                      + from_date_to_unix + ' and UNIX_TIMESTAMP(create_date) <= ' + to_date_to_unix;
                totalCount = await mysql_function.queryData(query);

            } else {
                query = 'select address, partnerCode, token, network, create_date from cyber_media_wallet where partnerCode = "' 
                        + partnerCode + '" order by id desc limit ' + limit + ' offset ' + offset;
                result = await mysql_function.queryData(query);

                query = 'select count(*) as totalCount from cyber_media_wallet where partnerCode = "' + partnerCode + '"';
                totalCount = await mysql_function.queryData(query);
            }
        } else {
              if(Boolean(fromDate) && Boolean(toDate)) {
                var from_date_to_unix = new moment(fromDate).unix();
                var to_date_to_unix = new moment(toDate).unix();

                query = 'select address, partnerCode, token, network, create_date from cyber_media_wallet where UNIX_TIMESTAMP(create_date) >= ' 
                        + from_date_to_unix + ' and UNIX_TIMESTAMP(create_date) <= ' + to_date_to_unix;
                result = await mysql_function.queryData(query);

                query = 'select count(*) as totalCount from cyber_media_wallet where UNIX_TIMESTAMP(create_date) >= ' 
                        + from_date_to_unix + ' and UNIX_TIMESTAMP(create_date) <= ' + to_date_to_unix;
                totalCount = await mysql_function.queryData(query);
            } else {
                query = 'select address, partnerCode, token, network, create_date from cyber_media_wallet order by id desc limit ' + limit + ' offset ' + offset;
                result = await mysql_function.queryData(query);

                query = 'select count(*) as totalCount from cyber_media_wallet';
                totalCount = await mysql_function.queryData(query);
            }
        }

        return res.status(200).send({
            status: 1,
            msg: 'success',
            data: {
                data: result,
                totalCount: totalCount && totalCount[0].totalCount
            }
        });
    });

    router.get(`/admin/wallets/:address`, async (req, res) => {
        const { address } = req.params;
        var token = null;

        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            token = req.headers.authorization.split(' ')[1];
        }

        if(token === null || token === undefined || token.length === 0 || token && token !== config.SECRET_KEY) {
            return res.status(200).send({
                status: 400,
                msg: "Invalid Token",
            });
        }

        let selectQuery = 'select * from ?? where ?? = ?';
        let query = mysql.format(selectQuery,["cyber_media_wallet", 'address', address]);

        await pool.query(query,(err, data) => {
            if(err) {
                console.error(err);
                return res.status(200).send({
                    status: 0,
                    msg: err,
                    data: null
                });
            }

            return res.status(200).send({
                status: 1,
                msg: 'success',
                data
            });
        });
    });

    router.get(`/admin/wallet_histories`, async (req, res) => {
        let { partnerCode, fromDate, toDate, limit = 10, offset = 0 } = req.query;
        var token = null;

        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            token = req.headers.authorization.split(' ')[1];
        }

        if(token === null || token === undefined || token.length === 0 || (token && token !== config.SECRET_KEY )) {
            return res.status(200).send({
                status: 400,
                msg: "Invalid Token",
            });
        }

        var query, result = [], totalCount = 0;

        if(partnerCode) {
            if(Boolean(fromDate) && Boolean(toDate)) {
                var from_date_to_unix = new moment(fromDate).unix();
                var to_date_to_unix = new moment(toDate).unix();

                query = 'select * from cyber_media_wallet_history where partnerCode = "' 
                       + partnerCode + '" and UNIX_TIMESTAMP(create_date) >= ' 
                       + from_date_to_unix + ' and UNIX_TIMESTAMP(create_date) <= '
                       + to_date_to_unix + ' order by id desc limit ' + limit + ' offset ' + offset;
                result = await mysql_function.queryData(query);

                query = 'select count(*) as totalCount from cyber_media_wallet_history where partnerCode = "' 
                      + partnerCode + '" and UNIX_TIMESTAMP(create_date) >= ' 
                      + from_date_to_unix + ' and UNIX_TIMESTAMP(create_date) <= ' + to_date_to_unix;
                totalCount = await mysql_function.queryData(query);
            }
            else {
                query = 'select * from cyber_media_wallet_history where partnerCode = "' 
                        + partnerCode + '" order by id desc limit ' + limit + ' offset ' + offset;
                result = await mysql_function.queryData(query);

                query = 'select count(*) as totalCount from cyber_media_wallet_history where partnerCode = "' + partnerCode + '"';
                totalCount = await mysql_function.queryData(query);
            }
        } else {
            if(Boolean(fromDate) && Boolean(toDate)) {
                var from_date_to_unix = new moment(fromDate).unix();
                var to_date_to_unix = new moment(toDate).unix();

                query = 'select * from cyber_media_wallet_history where UNIX_TIMESTAMP(create_date) >= ' 
                        + from_date_to_unix + ' and UNIX_TIMESTAMP(create_date) <= ' + to_date_to_unix;
                result = await mysql_function.queryData(query);

                query = 'select count(*) as totalCount from cyber_media_wallet_history where UNIX_TIMESTAMP(create_date) >= ' 
                        + from_date_to_unix + ' and UNIX_TIMESTAMP(create_date) <= ' + to_date_to_unix;
                totalCount = await mysql_function.queryData(query);
            } 
            else {
                query = 'select * from cyber_media_wallet_history order by id desc limit ' + limit + ' offset ' + offset;
                result = await mysql_function.queryData(query);

                query = 'select count(*) as totalCount from cyber_media_wallet_history';
                totalCount = await mysql_function.queryData(query);
            }
        }

       return res.status(200).send({
            status: 1,
            msg: 'success',
            data: {
                data: result,
                totalCount: totalCount && totalCount[0].totalCount
            }
        });
    });
}