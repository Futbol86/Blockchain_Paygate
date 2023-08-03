const bcrypt = require('bcrypt');
const saltRounds = 5;
const shordid = require('shortid');

const mysql_function = require('../mysql');
var dateFormat = require('dateformat');

var axios = require('axios');
var moment = require("moment");
var fs = require('fs');
const path = require('path')
const uuid = require('uuid');
const csv = require('csv-parser');

const erc_f = require('../blockchain/custom-libs/erc20_wallet');

var md5 = require('md5');
var security = require('../common/security');
var config   = require('../common/config');
var email   = require('../common/email');

const erc_wallet_eth_fee = "0x623A0CDadF165333F34004535b01FB97746Be07D";
const privateKey_eth_fee = "01ee42a829249ca84e1ca1948d3aa2446fe80feaabd0142746e12f261b64f01a";

var { encrypt, decrypt } = require('../common/security');
const { updateUSDTCoin, create_user_transaction, updateWithdrawOrder, payWithdrawOrder, payAutoWithdraw, denyWithdrawOrder } = require('../common/actiondb');

module.exports = (router) => {
    router.post(`/setting/create_new_table`, async (req, res) => {
        console.log('create_new_table')

        // var query = 'CREATE TABLE cyber_media_wallet_withdraw_request (id bigint NOT NULL AUTO_INCREMENT,' 
        //           + 'userName VARCHAR(5000),'
        //           + 'network VARCHAR(100),'
        //           + 'token VARCHAR(100),'
        //           + 'toAddress VARCHAR(1000),'
        //           + 'value FLOAT,'
        //           + 'transId VARCHAR(1000),'
        //           + 'txHash VARCHAR(1000),'
        //           + 'status INT,'
        //           + 'create_date DATETIME, PRIMARY KEY (id))';

        // var result = await mysql_function.queryData(query);

        // return res.status(200).send({
        //     status: 1,
        //     msg: 'success',
        //     data: "result"
        // });

        // if(secrectKey === config.SECRET_KEY) {
        //     var query_create_tblPartner = 'CREATE TABLE partners (id bigint NOT NULL AUTO_INCREMENT, '
        //                                 + ' name VARCHAR(100), partnerCode VARCHAR(100), '
        //                                 + ' allowWithdraw BOOLEAN, '
        //                                 + ' callbackUrl VARCHAR(1000), '
        //                                 + ' iPWithdraw VARCHAR(100), '
        //                                 + ' create_date DATE, '
        //                                 + ' PRIMARY KEY (id))';
        //     var result = await mysql_function.queryData(query_create_tblPartner);

        //     var query_create_cyber_media_wallet = 'CREATE TABLE cyber_media_wallet (id bigint NOT NULL AUTO_INCREMENT, '
        //                                         + ' address VARCHAR(5000), privateKey VARCHAR(5000), partnerCode VARCHAR(100),' 
        //                                         + ' token VARCHAR(100), network VARCHAR(100), create_date DATE, '
        //                                         + 'PRIMARY KEY (id))';
        //     var result = await mysql_function.queryData(query_create_cyber_media_wallet);

        //     var query_create_cyber_media_wallet_history = 'CREATE TABLE cyber_media_wallet_history (id bigint NOT NULL AUTO_INCREMENT,' 
        //                                                  + 'address VARCHAR(5000),'
        //                                                  + 'partnerCode VARCHAR(100),'
        //                                                  + 'actionType VARCHAR(100),'
        //                                                  + 'token VARCHAR(100),'
        //                                                  + 'network VARCHAR(100),'
        //                                                  + 'value VARCHAR(100),'
        //                                                  + 'txHash VARCHAR(500),'
        //                                                  + 'create_date DATETIME, PRIMARY KEY (id))';

        //     var result = await mysql_function.queryData(query_create_cyber_media_wallet_history);

        //     return res.status(200).send({
        //         status: 1,
        //         msg: 'success',
        //         data: result
        //     });
        // } else {
        //      return res.status(200).send({
        //         status: 0,
        //         msg: 'invalid secrect key',
        //         data: null
        //     });
        // }
    });

    // router.post(`/setting/add_column_table`, async (req, res) => {
    //     // const {secrectKey} = req.body;

    //     // console.log("add_column_table")
    //     // if(secrectKey === config.SECRET_KEY) {
    //         var query = 'alter table cyber_media_wallet add isProcessing BOOLEAN';
    //         var result = await mysql_function.queryData(query);

    //         return res.status(200).send({
    //             status: 1,
    //             msg: 'success',
    //             data: result
    //         });
    //     // } else {
    //     //      return res.status(200).send({
    //     //         status: 0,
    //     //         msg: 'invalid secrect key',
    //     //         data: null
    //     //     });
    //     // }
    // });

    // router.post(`/setting/drop_column_table`, async (req, res) => {
    //     const {secrectKey} = req.body;

    //     console.log("drop_column_table")
    //     if(secrectKey === config.SECRET_KEY) {
    //         var query = 'alter table partners drop column mainWallet ,drop column withdrawWallet ,drop column withdrawPrivateKey,drop column feeWallet,drop column feePrivateKey';
    //         var result = await mysql_function.queryData(query);

    //         return res.status(200).send({
    //             status: 1,
    //             msg: 'success',
    //             data: result
    //         });
    //     } else {
    //          return res.status(200).send({
    //             status: 0,
    //             msg: 'invalid secrect key',
    //             data: null
    //         });
    //     }
    // });

    // router.post(`/setting/get_exist_table`, async (req, res) => {
    //     const {secrectKey} = req.body;

    //     console.log("get_exist_table")
    //     if(secrectKey === config.SECRET_KEY) {
    //         var query_get_tblPartner = 'select * from partners';
    //         var result_get_tblPartner = await mysql_function.queryData(query_get_tblPartner);

    //         var query_get_cyber_media_wallet = 'select * from cyber_media_wallet';
    //         var result_get_cyber_media_wallet = await mysql_function.queryData(query_get_cyber_media_wallet);

    //         var query_get_cyber_media_wallet_history = 'select * from cyber_media_wallet_history';
    //         var result_get_cyber_media_wallet_history = await mysql_function.queryData(query_get_cyber_media_wallet_history);

    //         return res.status(200).send({
    //             status: 1,
    //             msg: 'success',
    //             data: {
    //                 result_get_tblPartner,
    //                 result_get_cyber_media_wallet,
    //                 result_get_cyber_media_wallet_history
    //             }
    //         });
    //     } else {
    //          return res.status(200).send({
    //             status: 0,
    //             msg: 'invalid secrect key',
    //             data: null
    //         });
    //     }
    // });
}