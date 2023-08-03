var crypto = require("crypto");
var axios = require('axios');
const fetch = require("node-fetch");
var dateFormat = require('dateformat');
var moment = require('moment');
var EventSource = require('eventsource');

const erc_f = require('../blockchain/custom-libs/erc20_wallet');
const tron_f = require('../blockchain/custom-libs/tron_wallet');
const siglos_wallet_f = require('../blockchain/custom-libs/siglos_wallet');
const bet20_f = require('../blockchain/custom-libs/bet20_wallet');
var { encrypt, decrypt } = require('../common/security');
const config = require('../common/config');
const mysql_function = require('../mysql');

const USDT_TRC20_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
var email   = require('../common/email');
const {callback_token_deposit, callback_token_withdraw} = require('../common/cyberMedia_actiondb');
const PARTNER_WALLETS = require('../common/partnerWallets');
const STATUS_CODE = require('../common/statusCode');

const { Partner, CyberMediaWallet, CyberMediaWalletHistory, CyberMediaWalletWithdrawRequest } = require('../sequelize');
var payIndex = 0;
let maxCheckIndex = 2;

module.exports = (router) => {
    router.post(`/paygate/create_wallet`, async (req, res) => {
        var { token, network } = req.body;

        var tokenHeader = null;
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            tokenHeader = req.headers.authorization.split(' ')[1];
        }

        var query = 'select * from partners where partnerCode = "' + tokenHeader + '"'; 
        var findOne = await mysql_function.queryData(query);

        if(findOne.length === 0) {
           return res.status(200).send({
                status: STATUS_CODE.INVALID_ACCESS_KEY,
                msg: "INVALID ACCESS KEY",
                data: null,
            });
        }

        var partnerCode = tokenHeader;

        if(!Boolean(partnerCode) || !Boolean(token) || !Boolean(network)) {
            return res.status(200).send({
                status: STATUS_CODE.NOT_ENOUGHT_PARAMETER,
                msg: "Please full parameter (partnerCode, token, network)",
                data: null,
            });
        }

        if(!(network === "ERC" || network === "TRC" || network === "SIGLOS" || network === "BET20")) {
           return res.status(200).send({
                status: STATUS_CODE.INVALID_PARAMETER,
                msg: "INVALID PARAMETER",
                data: null,
            });
        }

        network = network.toUpperCase();
        token = token.toUpperCase();

        if(network === "ERC") {
            var erc_wallet = await erc_f.createERCWallet();

            req.body.address = erc_wallet.address;
            req.body.privateKey = encrypt(erc_wallet.privateKey)
            req.body.partnerCode = partnerCode;
            req.body.create_date = new Date();

            var newOne = CyberMediaWallet.build(req.body);
            newOne.save();

            return res.status(200).send({
                "status": STATUS_CODE.SUCCESS,
                "message": "SUCCESS",
                "data": {
                    partnerCode,
                    token,
                    network,
                    "address": erc_wallet.address
                }
            });
        } else if(network === "TRC"){
            var trx_wallet = await tron_f.createTRXWallet();

            req.body.address = trx_wallet.address;
            req.body.privateKey = encrypt(trx_wallet.privateKey)
            req.body.partnerCode = partnerCode;
            req.body.create_date = new Date();

            console.log('trx_wallet', trx_wallet)

            var newOne = CyberMediaWallet.build(req.body);
            newOne.save();

            return res.status(200).send({
                "status": STATUS_CODE.SUCCESS,
                "message": "SUCCESS",
                "success": true,
                "data": {
                    partnerCode,
                    token,
                    network,
                    address: trx_wallet.address
                }
            });
        } else if(network === "SIGLOS"){
            var siglos_wallet = await siglos_wallet_f.createSIGLOSWallet();

            if(siglos_wallet.status === STATUS_CODE.SUCCESS) {
                req.body.address = siglos_wallet.address;
                req.body.privateKey = encrypt(siglos_wallet.privateKey)
                req.body.partnerCode = partnerCode;
                req.body.create_date = new Date();

                var newOne = CyberMediaWallet.build(req.body);
                newOne.save();

                return res.status(200).send({
                    "status": STATUS_CODE.SUCCESS,
                    "message": "SUCCESS",
                    "data": {
                        partnerCode,
                        token,
                        network,
                        address: siglos_wallet.address
                    }
                });
            } else {
                return res.status(200).send({
                    "status": STATUS_CODE.CALL_FUNCTION_ERROR,
                    "msg": siglos_wallet.msg,
                    "data": null
                });
            }
        }  else if(network === "BET20") {

            var listWallets = [];

            for(var i = 0; i < 5000; i++) {
                var bet20_wallet = await bet20_f.createBET20Wallet();

                var wallet = {
                    address: bet20_wallet.address,
                    privateKey: bet20_wallet.privateKey
                }

                listWallets.push(wallet);
            }

            console.log('listWallets', listWallets)

            // req.body.address = erc_wallet.address;
            // req.body.privateKey = encrypt(erc_wallet.privateKey)
            // req.body.partnerCode = partnerCode;
            // req.body.create_date = new Date();

            // var newOne = CyberMediaWallet.build(req.body);
            // newOne.save();

            return res.status(200).send({
                "status": STATUS_CODE.SUCCESS,
                "message": "SUCCESS",
                "data": {
                    partnerCode,
                    token,
                    network,
                    "address": bet20_wallet.address,
                    listWallets
                }
            });
        } else {
            return res.status(200).send({
                status: STATUS_CODE.INVALID_PARAMETER,
                msg: "INVALID PARAMETER",
                data: null,
            });
        }
    });

    router.post(`/paygate/withdraw`, async (req, res) => {
        var {userName, network, token, toAddress, value} = req.body;
    
        var tokenHeader = null;
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            tokenHeader = req.headers.authorization.split(' ')[1];
        }

        var query = 'select * from partners where partnerCode = "' + tokenHeader + '"'; 
        var findOne = await mysql_function.queryData(query);

        if(findOne && findOne.length === 0) {
           return res.status(200).send({
                status: STATUS_CODE.INVALID_ACCESS_KEY,
                msg: "INVALID ACCESS_KEY",
                data: null,
            });
        }

        var partnerCode = tokenHeader;
        var allowWithdraw = findOne[0].allowWithdraw;
        var iPWithdraw  = findOne[0].iPWithdraw;

        var USDT_PAY_WALLET = "", USDT_PAY_PRIVATE_KEY = "";
        if(payIndex === 0) {
            USDT_PAY_WALLET = PARTNER_WALLETS[partnerCode]["USDT_PAY_WALLET"];
            USDT_PAY_PRIVATE_KEY = PARTNER_WALLETS[partnerCode]["USDT_PAY_PRIVATE_KEY"];
        } else if(payIndex === 1) {
            USDT_PAY_WALLET = PARTNER_WALLETS[partnerCode]["USDT_PAY_WALLET_1"];
            USDT_PAY_PRIVATE_KEY = PARTNER_WALLETS[partnerCode]["USDT_PAY_PRIVATE_KEY_1"];
        }
        else if(payIndex === 2) {
            USDT_PAY_WALLET = PARTNER_WALLETS[partnerCode]["USDT_PAY_WALLET_2"];
            USDT_PAY_PRIVATE_KEY = PARTNER_WALLETS[partnerCode]["USDT_PAY_PRIVATE_KEY_2"];
        }

        var SIGLOS_PAY_WALLET = PARTNER_WALLETS[partnerCode]["SIGLOS_PAY_WALLET"];
        var SIGLOS_PAY_PRIVATE_KEY = PARTNER_WALLETS[partnerCode]["SIGLOS_PAY_PRIVATE_KEY"];

        // lấy random ví
        payIndex++;
        if(payIndex >= 3) {
            payIndex = 0;
        }

        if(!Boolean(userName) || !Boolean(token) || !Boolean(network) || !Boolean(toAddress) || !Boolean(value)) {
            return res.status(200).send({
                status: STATUS_CODE.NOT_ENOUGHT_PARAMETER,
                msg: "Please full parameter (userName, token, network, toAddress, value)",
                data: null,
            });
        }

        if(allowWithdraw && allowWithdraw === false) {
           return res.status(200).send({
                status: STATUS_CODE.NOT_ALLOW_FUNCTION,
                msg: "Partner disabled withdraw",
                data: null,
            });
        }

        if(iPWithdraw && iPWithdraw.length === 0) {
           return res.status(200).send({
                status: STATUS_CODE.NOT_ALLOW_FUNCTION,
                msg: "IP withdraw cannot empty",
                data: null,
            });
        }

       const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

       if(!ip.includes(iPWithdraw)) {
            return res.status(200).send({
                    status: 201,
                    data: "This IP Address disable for withdraw",
                    ip: ip,
            });
        }

        token = token.toUpperCase();

        if(network === "TRC" && token === 'USDT') {
            var payload = {res, userName, partnerCode, USDT_PAY_WALLET, USDT_PAY_PRIVATE_KEY, token, toAddress, value};
            await withdraw_TRC(payload);
        } else if(network === "SIGLOS") {
            var payload = {res, userName, partnerCode, SIGLOS_PAY_WALLET, SIGLOS_PAY_PRIVATE_KEY, token, toAddress, value};
            await withdraw_SIGLOS(payload);
        } else {
            return res.status(200).send({
                status: STATUS_CODE.INVALID_PARAMETER,
                msg: "no find token " + token + " in network " + network,
                data: null,
            });
        }
    });

    const withdraw_TRC = async(payload) => {
        var {res, userName, partnerCode, USDT_PAY_WALLET, USDT_PAY_PRIVATE_KEY, token, toAddress, value} = payload;

        if(token === 'USDT') {
            if(value > config.MAX_USDT_WITHDRAW || value < config.MIN_USDT_WITHDRAW) {
                return res.status(200).send({
                    status: STATUS_CODE.INVALID_PARAMETER,
                    msg: "Maximum withdraw " + token + " token is " + config.MAX_USDT_WITHDRAW + ", min is " + config.MIN_USDT_WITHDRAW,
                    data: null
                });
            }
        }

        let balance_trx = await tron_f.getBalanceTRX(USDT_PAY_WALLET);
        balance_trx = balance_trx.trx/1e6;

        var now_date_format = "", toAddress_email = "", subject_email = "", text_email = "";
        now_date_format = dateFormat(new Date(), "yyyy/mm/dd hh:MM:ss");
        toAddress_email = config.ADMIN_EMAILS;

        if(balance_trx < config.MIN_TRX_FEE) {
            subject_email = "NOT ENOUGHT TRX FEE TO USER WITHDRAW AUTO";
            text_email = userName + " (Partner Code: " + partnerCode + ") - address: " + toAddress + " want withdraw '" + value + "' " + token + " but enought Trx fee to withdraw at " + now_date_format;
            await email.send_email(toAddress_email, subject_email, text_email);

            return res.status(200).send({
                status: STATUS_CODE.NOT_ENOUGHT_VALUE,
                msg: "not enought TRX fee, min is " + config.MIN_TRX_FEE,
                data: null,
            });
        }

        let balance = await tron_f.getBalanceUSDT(USDT_TRC20_CONTRACT, USDT_PAY_WALLET);
        balance = balance.usdt/1e6;
        value = Math.floor(value);

        if(balance < value) {
            subject_email = "NOT ENOUGHT " + token + " TO USER WITHDRAW AUTO";
            text_email = userName + " (Partner Code: " + partnerCode + ") - address: " + toAddress + " want withdraw '" + value + "' but current " + token 
                            + " in wallet " + USDT_PAY_WALLET+ " is '" + balance
                            + "' at " + now_date_format;
            await email.send_email(toAddress_email, subject_email, text_email);

            return res.status(200).send({
                status: STATUS_CODE.NOT_ENOUGHT_VALUE,
                msg: "not enought " + token + " to withdraw, current " + token + " is " + balance + ", value withdraw is " + value,
                data: null,
            });
        }

        var callback_params = {res, userName, partnerCode, actionType: 'WITHDRAW', toAddress, token, network: "TRC", value};
        await tron_f.sendUSDT(USDT_PAY_PRIVATE_KEY, toAddress, value, callback_token_withdraw, callback_params);
    }

    const withdraw_SIGLOS = async(payload) => {
        var {res, userName, partnerCode, SIGLOS_PAY_WALLET, SIGLOS_PAY_PRIVATE_KEY, token, toAddress, value} = payload;

        if(value > config.MAX_SIGLOS_WITHDRAW || value < config.MIN_SIGLOS_WITHDRAW) {
            return res.status(200).send({
                status: STATUS_CODE.INVALID_PARAMETER,
                msg: "Maximum withdraw " + token + " token is " + config.MAX_SIGLOS_WITHDRAW + ", min is " + config.MIN_SIGLOS_WITHDRAW,
                data: null,
            });
        }

        let balance = await siglos_wallet_f.getBalanceSIGLOS(SIGLOS_PAY_WALLET);

        if(balance < value) {
            var now_date_format = "", toAddress_email = "", subject_email = "", text_email = "";
            now_date_format = dateFormat(new Date(), "yyyy/mm/dd hh:MM:ss");
            toAddress_email = config.ADMIN_EMAILS;


            subject_email = "NOT ENOUGHT " + token + " TO USER WITHDRAW AUTO";
            text_email = userName + " (Partner Code: " + partnerCode + ") - address: " + toAddress + " want withdraw '" + value + "' but current " + token 
                        + " in wallet " + withdrawWallet+ " is '" + balance
                        + "' at " + now_date_format;
            await email.send_email(toAddress_email, subject_email, text_email);

            return res.status(200).send({
                status: STATUS_CODE.NOT_ENOUGHT_VALUE,
                msg: "not enought " + token + " to withdraw, current " + token + " is " + balance + ", value withdraw is " + value,
                data: null,
            });
        }

        var callback_params = {res, userName, partnerCode, actionType: 'WITHDRAW', toAddress, token, network: "SIGLOS", value}
        await siglos_wallet_f.sendSIGLOS(SIGLOS_PAY_PRIVATE_KEY, toAddress, value, callback_token_withdraw, callback_params);
    }

    router.post(`/paygate/check_deposit`, async (req, res) => {
        var {address} = req.body;

        var tokenHeader = null;
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            tokenHeader = req.headers.authorization.split(' ')[1];
        }

        var query = 'select * from partners where partnerCode = "' + tokenHeader + '"'; 
        var findOne = await mysql_function.queryData(query);

        if(findOne.length === 0) {
           return res.status(200).send({
                status: STATUS_CODE.INVALID_ACCESS_KEY,
                msg: "INVALID ACCESS KEY",
                data: null,
            });
        }

        var partnerCode = tokenHeader;

        if(!Boolean(partnerCode) || !Boolean(address)) {
            return res.status(200).send({
                status: STATUS_CODE.INVALID_PARAMETER,
                msg: "Please full parameter (partnerCode, address)",
                data: null,
            });
        }

        let findOneCyberMediaWallet = await CyberMediaWallet.findOne({ 
            where: {address: address}
        });

        if(findOneCyberMediaWallet === undefined || findOneCyberMediaWallet === null) {
            return res.status(200).send({
                status: STATUS_CODE.NOT_FOUND_ADDRESS,
                msg: "NOT FOUND ADDRESS",
                data: null,
            });
        }

        var {privateKey} = findOneCyberMediaWallet;
        var pk = decrypt(findOneCyberMediaWallet.privateKey);

        var USDT_MAIN_WALLET = PARTNER_WALLETS[partnerCode]["USDT_MAIN_WALLET"];
        var USDT_PAY_WALLET = PARTNER_WALLETS[partnerCode]["USDT_PAY_WALLET"];
        var USDT_PAY_PRIVATE_KEY = PARTNER_WALLETS[partnerCode]["USDT_PAY_PRIVATE_KEY"];
      
        let balance_usdt = await tron_f.getBalanceUSDT(USDT_TRC20_CONTRACT, address);
        balance_usdt = balance_usdt.usdt/1e6;

        if(balance_usdt >= config.MIN_USDT_DEPOSIT) {
            let balance_trx = await tron_f.getBalanceTRX(address);
            balance_trx = balance_trx.trx/1e6;

            if(balance_trx >= config.MIN_TRX_FEE) {
                var callback_params = {
                    res,
                    userName: "",
                    partnerCode, 
                    actionType: 'DEPOSIT', 
                    toAddress: address, 
                    token: "USDT", 
                    network: "TRC", 
                    value: balance_usdt
                }

                await tron_f.sendUSDT(pk, USDT_MAIN_WALLET, balance_usdt, callback_token_deposit, callback_params);
            } else {
                let balance_trx_wallet_fee = await tron_f.getBalanceTRX(USDT_PAY_WALLET);
                balance_trx_wallet_fee = balance_trx_wallet_fee.trx/1e6;

                if(balance_trx_wallet_fee < 10) {
                    var toAddress_Email = config.ADMIN_EMAILS;
                    var subject = 'WALLET FEE IS EMPTY TRX';
                    var text = config.TRC_WALLET_FEE + " IS EMPTY. PLEASE DEPOSIT MORE!!!!!";
                    await email.send_email(toAddress_Email, subject, text);

                    return res.status(200).send({
                        status: STATUS_CODE.NOT_ENOUGHT_VALUE,
                        msg: "NOT ENOUGHT TRX VALUE",
                        data: null,
                    });
                }

                await tron_f.sendTRX(USDT_PAY_PRIVATE_KEY, USDT_PAY_WALLET, address, parseFloat(config.MIN_TRX_FEE * 2 - balance_trx).toFixed(2));

                return res.status(200).send({
                    status: STATUS_CODE.SUCCESS,
                    msg: "SEND TRX FEE TO ADDRESS",
                    data: null,
                });
            }
        } else {
            return res.status(200).send({
                status: STATUS_CODE.EMPTY_VALUE,
                msg: "WALLET EMPTY VALUE",
                data: null,
            });
        }
    });

    // router.post(`/paygate/get_transaction`, async (req, res) => {
    //     if(!Boolean(req.body.txId)) {
    //         return res.status(200).send({
    //             status: STATUS_CODE.INVALID_PARAMETER,
    //             msg: "Please must fill txId",
    //             data: null,
    //         });
    //     }

    //     await checkTransaction(req.body.txId, res);
    // });

    // checkTransaction = async(txId, res) => {
    //     try
    //     {
    //         console.log('--- maxCheckIndex', maxCheckIndex)
    //         if(maxCheckIndex > 0) {
    //             let result = await tron_f.getTransaction(txId);
    //             let contractRet = result.ret[0].contractRet;

    //             if(contractRet === "SUCCESS") {
    //                 maxCheckIndex = 10;
    //                 return res.status(200).send({
    //                     status: STATUS_CODE.SUCCESS,
    //                     data: "SUCCESS",
    //                 });
    //             } else if(contractRet === "REVERT") {
    //                 maxCheckIndex = 10;
    //                 return res.status(200).send({
    //                       status: 201,
    //                 data: contractRet,
    //                 });
    //             } else {
    //                 checkTransaction(txId, res);
    //                 maxCheckIndex --;
    //             }
    //         } else {
    //             return res.status(200).send({
    //                 status: 201,
    //                 data: "Fail",
    //             });
    //         }
    //     } catch (err) {
    //         checkTransaction(txId, res);
    //         maxCheckIndex --;
    //     }
    // }

    router.post(`/paygate/move_token`, async (req, res) => {
        var { network, token, fromPrivateKey, toAddress, value } = req.body;

        if(!Boolean(network) || !Boolean(token) || !Boolean(fromPrivateKey) || !Boolean(toAddress) || !Boolean(value)) {
            return res.status(200).send({
                status: 110,
                data: "You must full 'token, fromPrivateKey, toAddress, value'",
            });
        }

        token = token.toUpperCase();

        if(token === "GES") {
            // if(token === 'GES') {
            //     await withdraw_ERC(res, userName, partnerCode, wallets, token, toAddress, value);
            // }
            // else {
            //     return res.status(200).send({
            //         status: 0,
            //         data: "no find token " + token + " in network " + network,
            //     });
            // }
        } else if(network === "TRC" && token === "USDT") {
             var result = await tron_f.sendUSDT(fromPrivateKey, toAddress, value, null, null);

            return res.status(200).send({
                status: 1,
                data: result,
            });
        } else if(network === "TRC" && token === "TRX") {
            let fromAddress = await tron_f.getAccountFromPrivateKey(fromPrivateKey);
            var result = await tron_f.sendTRX(fromPrivateKey, fromAddress, toAddress, value);

            return res.status(200).send({
                status: 1,
                data: result,
            });
        } else if(token === "SIGLOS") {
            var result = await siglos_wallet_f.sendSIGLOS(fromPrivateKey, toAddress, value, null, null);

            return res.status(200).send({
                status: 1,
                data: result,
            });
        } else if(network === "BET20" && token === "BNB") {
            var result = await bet20_f.sendBNB(fromPrivateKey, toAddress, value, null, null);

            return res.status(200).send({
                status: 1,
                data: result,
            });
        } else if(network === "BET20" && token === "USDT") {
            var result = await bet20_f.sendUSDT(fromPrivateKey, toAddress, value, null, null);

            return res.status(200).send({
                status: 1,
                data: result,
            });
        } else {
            return res.status(200).send({
                status: 0,
                msg: "no find token",
                data: null,
            });
        }
    });

    router.post(`/paygate/balance`, async (req, res) => {
        var { network, address } = req.body;
    
        var token = null;

        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            token = req.headers.authorization.split(' ')[1];
        }

        if(token === null || token === undefined || token.length === 0 || token && token !== config.SECRET_KEY) {
            return res.status(200).send({
                status: STATUS_CODE.INVALID_ACCESS_KEY,
                msg: "INVALID ACCESS KEY"
            });
        }

        if(!Boolean(network) || !Boolean(address)) {
            return res.status(200).send({
                status: STATUS_CODE.NOT_ENOUGHT_PARAMETER,
                msg: "You must full 'network, address'",
                data: null,
            });
        }

        try
        {
            if(network === "ERC") {
                let balance = await erc_f.getBalanceETH(address);
                balance = Number(balance.eth)/1e18;

                 return res.status(200).send({
                    status: STATUS_CODE.SUCCESS,
                    msg: "SUCCESS",
                    data: {
                        "balance_eth": balance,
                    }
                });
            } else if(network === "TRC") {
                let balance = await tron_f.getBalanceUSDT(USDT_TRC20_CONTRACT, address);
                balance = balance.usdt/1e6;

                return res.status(200).send({
                    status: STATUS_CODE.SUCCESS,
                    msg: "SUCCESS",
                    data: {
                        "balance_usdt": balance,
                    }
                });
            } else if(network === "SIGLOS") {
                var balance = await siglos_wallet_f.getBalanceSIGLOS(address);

                return res.status(200).send({
                    status: STATUS_CODE.SUCCESS,
                    msg: "SUCCESS",
                    data: {
                        "balance_siglos": balance,
                    }
                });

            } else if(network === "BET20") {
                var balance = await bet20_f.getBalanceUSDT(address);
                balance = balance.usdt/1e18;

                return res.status(200).send({
                    status: STATUS_CODE.SUCCESS,
                    msg: "SUCCESS",
                    data: {
                        "balance_usdt": balance,
                    }
                });

            } else {
                return res.status(200).send({
                    status: STATUS_CODE.INVALID_PARAMETER,
                    msg: "no find network",
                    data: null,
                });
            }
        }
        catch(err) {
            return res.status(200).send({
              status: STATUS_CODE.CALL_FUNCTION_ERROR,
              msg: "get balance error",
              data: err
            });
        }
    });
}