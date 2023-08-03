var crypto = require("crypto");
var axios = require('axios');
const fetch = require("node-fetch");
var dateFormat = require('dateformat');
var moment = require('moment');
var shortId = require('shortid');
const erc_f = require('../blockchain/custom-libs/erc20_wallet');
const tron_f = require('../blockchain/custom-libs/tron_wallet');
var { encrypt, decrypt } = require('../common/security');
const config = require('../common/config');
const mysql_function = require('../mysql');

const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const GES_CONTRACT = '0xd667d5a228cb09f190c4308cf89d39cab18a413c';
const etherscan_api = "R6UWHB51I91M8H1W9A9C9M26UEYPGV392F";
var email   = require('../common/email');

module.exports = (router) => {
    router.post(`/partner/create`, async (req, res) => {
        let { name, allowWithdraw = false, callbackUrl, iPWithdraw = '127.0.0.1', mainWallet, withdrawWallet, withdrawPrivateKey, feeWallet, feePrivateKey } = req.body;
        name = name.toUpperCase();
        var token = null;

        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            token = req.headers.authorization.split(' ')[1];
        }

        if(token === null || token && token !== config.SECRET_KEY) {
            return res.status(200).send({
                status: 400,
                msg: "Invalid Token",
            });
        }

        if(!Boolean(name) || !Boolean(callbackUrl) ) {
            return res.status(200).send({
                status: 400,
                msg: "Please full parameter (name, callbackUrl)",
            });
        }

        var query = 'select * from partners where name = "' + name + '"'; 
        var findOne = await mysql_function.queryData(query);
        
        if(findOne && findOne.length == 0) {
            var partnerCode = name.toUpperCase() + '@' + shortId.generate().toUpperCase();

            query = 'select * from partners where partnerCode = "' + partnerCode + '"'; 
            findOne = await mysql_function.queryData(query);

            if(findOne && findOne.length == 0) {
                var wallets = {
                    "ercMainWallet": req.body.ercMainWallet,
                    "ercWithdrawWallet": req.body.ercWithdrawWallet,
                    "ercWithdrawPrivateKey": req.body.ercWithdrawPrivateKey ? encrypt(req.body.ercWithdrawPrivateKey) : "",
                    "ercFeeWallet": req.body.ercFeeWallet,
                    "ercFeePrivateKey": req.body.ercFeePrivateKey ? encrypt(req.body.ercFeePrivateKey) : "",

                    "trcMainWallet": req.body.trcMainWallet,
                    "trcWithdrawWallet": req.body.trcWithdrawWallet,
                    "trcWithdrawPrivateKey": req.body.trcWithdrawPrivateKey ? encrypt(req.body.trcWithdrawPrivateKey) : "",
                    "trcFeeWallet": req.body.trcFeeWallet,
                    "trcFeePrivateKey": req.body.trcFeePrivateKey ? encrypt(req.body.trcFeePrivateKey) : "",

                    "siglosMainWallet": req.body.siglosMainWallet,
                    "siglosWithdrawWallet": req.body.siglosWithdrawWallet,
                    "siglosWithdrawPrivateKey": req.body.siglosWithdrawPrivateKey ? encrypt(req.body.siglosWithdrawPrivateKey) : "",
                    "siglosFeeWallet": req.body.siglosFeeWallet,
                    "siglosFeePrivateKey": req.body.siglosFeePrivateKey ? encrypt(req.body.siglosFeePrivateKey) : "",
                }

                let wallets_stringify = JSON.stringify(wallets);
                var date_format = dateFormat(new Date(), "yyyy/mm/dd hh:MM:ss");

                query = "INSERT INTO partners VALUES ("
                        + null + "," 
                        + "'" + name + "'" + "," 
                        + "'" + partnerCode + "'" + ","
                        + allowWithdraw + ","
                        + "'" + callbackUrl + "'" + ","
                        + "'" + iPWithdraw + "'" + ","
                        + "'" + date_format + "'" + ","
                        + "'" + wallets_stringify + "'" + ")";
                        

                findOne = await mysql_function.queryData(query);

                return res.status(200).send({
                    status: 1,
                    msg: "success",
                    data: {
                        name,
                        partnerCode,
                        allowWithdraw,
                        callbackUrl,
                        iPWithdraw,
                        wallets
                    }
                });
            } else {
                return res.status(200).send({
                    status: 201,
                    msg: "partner code is existed",
                    data: null,
                });
            }

        } else {
            return res.status(200).send({
                status: 201,
                msg: "name is existed",
                data: null,
            });
        }
    });

    router.post(`/partner/wallet/update`, async (req, res) => {
        const { name } = req.body;
        var token = null;

        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            token = req.headers.authorization.split(' ')[1];
        }

        if(token === null || token && token !== config.SECRET_KEY) {
            return res.status(200).send({
                status: 400,
                msg: "Invalid Token",
            });
        }

        if(!Boolean(name)) {
            return res.status(200).send({
                status: 400,
                msg: "Please full parameter (name)",
            });
        }

        var query = 'select * from partners where name = "' + name + '"'; 
        var findOne = await mysql_function.queryData(query);
        
        if(findOne && findOne.length !== 0) {
            var wallets = {
                    "ercMainWallet": req.body.ercMainWallet,
                    "ercWithdrawWallet": req.body.ercWithdrawWallet,
                    "ercWithdrawPrivateKey": req.body.ercWithdrawPrivateKey ? encrypt(req.body.ercWithdrawPrivateKey) : "",
                    "ercFeeWallet": req.body.ercFeeWallet,
                    "ercFeePrivateKey": req.body.ercFeePrivateKey ? encrypt(req.body.ercFeePrivateKey) : "",

                    "trcMainWallet": req.body.trcMainWallet,
                    "trcWithdrawWallet": req.body.trcWithdrawWallet,
                    "trcWithdrawPrivateKey": req.body.trcWithdrawPrivateKey ? encrypt(req.body.trcWithdrawPrivateKey) : "",
                    "trcFeeWallet": req.body.trcFeeWallet,
                    "trcFeePrivateKey": req.body.trcFeePrivateKey ? encrypt(req.body.trcFeePrivateKey) : "",

                    "siglosMainWallet": req.body.siglosMainWallet,
                    "siglosWithdrawWallet": req.body.siglosWithdrawWallet,
                    "siglosWithdrawPrivateKey": req.body.siglosWithdrawPrivateKey ? encrypt(req.body.siglosWithdrawPrivateKey) : "",
                    "siglosFeeWallet": req.body.siglosFeeWallet,
                    "siglosFeePrivateKey": req.body.siglosFeePrivateKey ? encrypt(req.body.siglosFeePrivateKey) : "",
            }

            let wallets_stringify = JSON.stringify(wallets);
            query = "UPDATE partners SET " + "wallets = '" + wallets_stringify + "' where name = '" + name + "'" ;
            var result = await mysql_function.queryData(query);

            return res.status(200).send({
                status: 1,
                msg: "success",
                data: result
            });
        } else {
            return res.status(200).send({
                status: 201,
                msg: "partner code is not existed",
                data: null,
            });
        }
    });

    router.post(`/partner/wallet/delete`, async (req, res) => {
        const { name } = req.body;
        var token = null;

        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            token = req.headers.authorization.split(' ')[1];
        }

        if(token === null || token && token !== config.SECRET_KEY) {
            return res.status(200).send({
                status: 400,
                msg: "Invalid Token",
            });
        }

        if(!Boolean(name)) {
            return res.status(200).send({
                status: 400,
                msg: "Please full parameter (name)",
            });
        }

        var query = 'delete from partners where name = "' + name + '"'; 
        var result = await mysql_function.queryData(query);
        
        return res.status(200).send({
            status: 1,
            msg: "success",
            data: result
        });
    });
}