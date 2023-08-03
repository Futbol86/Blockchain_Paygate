var crypto = require("crypto");
var axios = require('axios');
const fetch = require("node-fetch");
var dateFormat = require('dateformat');
var moment = require('moment');
const nodemailer = require("nodemailer");
const Email = require('email-templates');

var { encrypt, decrypt } = require('../common/security');
const config = require('../common/config');
const partnerWallets = require('../common/partnerWallets');
const STATUS_CODE = require('../common/statusCode');
const mysql_function = require('../mysql');

const { callback_token_deposit, callback_token_withdraw } = require('../common/cyberMedia_actiondb');
const { CyberMediaWallet } = require('../sequelize');

const tron_f = require('../blockchain/custom-libs/tron_wallet');
const siglos_wallet_f = require('../blockchain/custom-libs/siglos_wallet');

module.exports = (router) => {
    router.post(`/privateBank/callbackDepositToken`, async (req, res) => {
        var { actionType = "DEPOSIT_PRIVATE_BANK", address, value, txHash } = req.body;

        var tokenHeader = null;
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            tokenHeader = req.headers.authorization.split(' ')[1];
        }

        if(tokenHeader === null || tokenHeader === undefined || tokenHeader.length === 0 || tokenHeader && tokenHeader !== config.SECRET_KEY) {
            return res.status(200).send({
                status: STATUS_CODE.INVALID_ACCESS_KEY,
                msg: "INVALID ACCESS KEY",
            });
        }

        if(!Boolean(address) || !Boolean(value) || !Boolean(txHash)) {
            return res.status(200).send({
                status: STATUS_CODE.INVALID_PARAMETER,
                data: "You must fill 'address, value, txHash'",
            });
        }

        value = parseFloat(value.toFixed(1));

        // chuyen Token tu Private Bank --> Partner
        let findOneCyberMediaWallet = await CyberMediaWallet.findOne({ 
            where: {address: address}
        });

        if(findOneCyberMediaWallet && findOneCyberMediaWallet.length !== 0) {
            let PARTNER_CODE = findOneCyberMediaWallet.partnerCode;
            let TOKEN = findOneCyberMediaWallet.token;

            if(TOKEN === "SIGLOS") {
                let PRIVATE_BANK_SIGLOS_PAY_WALLET = partnerWallets["PRIVATE_BANK"]["SIGLOS_PAY_WALLET"];
                let PRIVATE_BANK_SIGLOS_PAY_PK     = partnerWallets["PRIVATE_BANK"]["SIGLOS_PAY_PRIVATE_KEY"];
                let PARTNER_SIGLOS_MAIN_WALLET     = partnerWallets[PARTNER_CODE]["SIGLOS_MAIN_WALLET"];

                let private_bank_balance = await siglos_wallet_f.getBalanceSIGLOS(PRIVATE_BANK_SIGLOS_PAY_WALLET);

                if(private_bank_balance < value + 1) {
                    return res.status(200).send({
                        status: STATUS_CODE.NOT_ENOUGHT_VALUE,
                        msg: "PRIVATE BANK NOT ENOUGHT VALUE",
                        data: null
                    });
                }

                var callback_params = {
                    res,
                    userName: "",
                    partnerCode: findOneCyberMediaWallet.partnerCode, 
                    actionType, 
                    toAddress: address, 
                    token: findOneCyberMediaWallet.token, 
                    network: findOneCyberMediaWallet.network, 
                    value
                }

                await siglos_wallet_f.sendSIGLOS(PRIVATE_BANK_SIGLOS_PAY_PK, PARTNER_SIGLOS_MAIN_WALLET, value, callback_token_deposit, callback_params);
            } else if(TOKEN === "USDT") {
                let PRIVATE_BANK_USDT_PAY_WALLET = partnerWallets["PRIVATE_BANK"]["USDT_PAY_WALLET"];
                let PRIVATE_BANK_USDT_PAY_PK     = partnerWallets["PRIVATE_BANK"]["USDT_PAY_PRIVATE_KEY"];
                let PARTNER_USDT_MAIN_WALLET     = partnerWallets[PARTNER_CODE]["USDT_MAIN_WALLET"];

                let private_bank_balance = await tron_f.getBalanceUSDT('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', PRIVATE_BANK_USDT_PAY_WALLET);
                private_bank_balance = private_bank_balance.usdt/1e6;

                if(private_bank_balance < value + 1) {
                    return res.status(200).send({
                        status: STATUS_CODE.NOT_ENOUGHT_VALUE,
                        msg: "PRIVATE BANK NOT ENOUGHT VALUE",
                        data: null
                    });
                }

                let private_bank_trx = await tron_f.getBalanceTRX(PRIVATE_BANK_USDT_PAY_WALLET);
                private_bank_trx = private_bank_trx.trx/1e6;

                if(private_bank_trx < value + 4) {
                    return res.status(200).send({
                        status: STATUS_CODE.NOT_ENOUGHT_VALUE,
                        msg: "PRIVATE BANK NOT ENOUGHT FEE TRX",
                        data: null
                    });
                }

                var callback_params = {
                    res,
                    userName: "",
                    partnerCode: findOneCyberMediaWallet.partnerCode, 
                    actionType, 
                    toAddress: address, 
                    token: findOneCyberMediaWallet.token, 
                    network: findOneCyberMediaWallet.network, 
                    value
                }

                await tron_f.sendUSDT(PRIVATE_BANK_USDT_PAY_PK, PARTNER_USDT_MAIN_WALLET, value, callback_token_deposit, callback_params);
            }
        } else {
            return res.status(200).send({
                status: STATUS_CODE.NOT_FOUND_ADDRESS,
                msg: "NOT FOUND ADDRESS",
                data: null
            });
        }
    });

    router.post(`/privateBank/callbackWithdrawToken`, async (req, res) => {
        var { actionType = "WITHDRAW_PRIVATE_BANK", address, value, txHash } = req.body;
        
        var tokenHeader = null;
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            tokenHeader = req.headers.authorization.split(' ')[1];
        }

        if(tokenHeader === null || tokenHeader === undefined || tokenHeader.length === 0 || tokenHeader && tokenHeader !== config.SECRET_KEY) {
            return res.status(200).send({
                status: 400,
                msg: "Invalid Token",
            });
        }

        if(!Boolean(address) || !Boolean(value) || !Boolean(txHash)) {
            return res.status(200).send({
                status: 110,
                data: "You must fill 'address, value, txHash'",
            });
        }

        value = parseFloat(value.toFixed(1));

        // chuyen Token tu Partner --> Private bank
        let findOneCyberMediaWallet = await CyberMediaWallet.findOne({ 
            where: {address: address}
        });

        if(findOneCyberMediaWallet && findOneCyberMediaWallet.length !== 0) {
            let PARTNER_CODE = findOneCyberMediaWallet.partnerCode;
            let TOKEN = findOneCyberMediaWallet.token;

            if(TOKEN === "SIGLOS") {
                let PRIVATE_BANK_SIGLOS_MAIN_WALLET = partnerWallets["PRIVATE_BANK"]["SIGLOS_MAIN_WALLET"];
                let PARTNER_SIGLOS_PAY_WALLET       = partnerWallets[PARTNER_CODE]["SIGLOS_PAY_WALLET"];
                let PARTNER_SIGLOS_PAY_PK           = partnerWallets[PARTNER_CODE]["SIGLOS_PAY_PRIVATE_KEY"];

                let partner_balance = await siglos_wallet_f.getBalanceSIGLOS(PARTNER_SIGLOS_PAY_WALLET);

                if(partner_balance < value + 1) {
                    return res.status(200).send({
                        status: STATUS_CODE.NOT_ENOUGHT_VALUE,
                        msg: "PARTNER NOT ENOUGHT VALUE",
                        data: null
                    });
                }

                var callback_params = {
                    res,
                    userName: "",
                    partnerCode: findOneCyberMediaWallet.partnerCode, 
                    actionType, 
                    toAddress: address, 
                    token: findOneCyberMediaWallet.token, 
                    network: findOneCyberMediaWallet.network, 
                    value
                }

                await siglos_wallet_f.sendSIGLOS(PARTNER_SIGLOS_PAY_PK, PRIVATE_BANK_SIGLOS_MAIN_WALLET, value, callback_token_withdraw, callback_params);
            } else if(TOKEN === "USDT") {
                let PRIVATE_BANK_USDT_MAIN_WALLET = partnerWallets["PRIVATE_BANK"]["USDT_MAIN_WALLET"];
                
                let PARTNER_USDT_PAY_WALLET       = partnerWallets[PARTNER_CODE]["USDT_PAY_WALLET"];
                let PARTNER_USDT_PAY_PK           = partnerWallets[PARTNER_CODE]["USDT_PAY_PRIVATE_KEY"];

                let partner_balance = await tron_f.getBalanceUSDT('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', PARTNER_USDT_PAY_WALLET);
                partner_balance = partner_balance.usdt/1e6;

                if(partner_balance < value + 1) {
                    return res.status(200).send({
                        status: STATUS_CODE.NOT_ENOUGHT_VALUE,
                        msg: "PARTNER NOT ENOUGHT VALUE",
                        data: null
                    });
                }

                let partner_trx = await tron_f.getBalanceTRX(PARTNER_USDT_PAY_WALLET);
                partner_trx = partner_trx.trx/1e6;

                if(partner_trx < value + 4) {
                    return res.status(200).send({
                        status: STATUS_CODE.NOT_ENOUGHT_VALUE,
                        msg: "PARTNER NOT ENOUGHT FEE TRX",
                        data: null
                    });
                }

                var callback_params = {
                    res,
                    userName: "",
                    partnerCode: findOneCyberMediaWallet.partnerCode, 
                    actionType, 
                    toAddress: address, 
                    token: findOneCyberMediaWallet.token, 
                    network: findOneCyberMediaWallet.network, 
                    value
                }

                await tron_f.sendUSDT(PARTNER_USDT_PAY_PK, PRIVATE_BANK_USDT_MAIN_WALLET, value, callback_token_withdraw, callback_params);
            }  
        } else {
            return res.status(200).send({
                status: STATUS_CODE.NOT_FOUND_ADDRESS,
                msg: "NOT FOUND ADDRESS",
                data: null
            });
        }
    });

    router.post(`/privateBank/checkPayWalletBalance`, async (req, res) => {
        var { partnerList } = req.body;
        var result = [];
        
        if(partnerList && partnerList.length > 0) {
            for(var i = 0; i < partnerList.length; i++) {
                var partnerCode = partnerList[i];

                let USDT_MAIN_WALLET               = partnerWallets[partnerCode]["USDT_MAIN_WALLET"];
                let USDT_PAY_WALLET                = partnerWallets[partnerCode]["USDT_PAY_WALLET"];
                let USDT_PAY_WALLET_1              = partnerWallets[partnerCode]["USDT_PAY_WALLET_1"];
                let USDT_PAY_WALLET_2              = partnerWallets[partnerCode]["USDT_PAY_WALLET_2"];

             
                let main_wallet_trx_balance = await tron_f.getBalanceTRX(USDT_MAIN_WALLET);
                main_wallet_trx_balance = main_wallet_trx_balance.trx/1e6;
                let main_wallet_usdt_balance = await tron_f.getBalanceUSDT('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', USDT_MAIN_WALLET);
                main_wallet_usdt_balance = main_wallet_usdt_balance.usdt/1e6;

                let pay_wallet_trx_balance = await tron_f.getBalanceTRX(USDT_PAY_WALLET);
                pay_wallet_trx_balance = pay_wallet_trx_balance.trx/1e6;
                let pay_wallet_usdt_balance = await tron_f.getBalanceUSDT('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', USDT_PAY_WALLET);
                pay_wallet_usdt_balance = pay_wallet_usdt_balance.usdt/1e6;

                let pay_wallet_1_trx_balance = await tron_f.getBalanceTRX(USDT_PAY_WALLET_1);
                pay_wallet_1_trx_balance = pay_wallet_1_trx_balance.trx/1e6;
                let pay_wallet_1_usdt_balance = await tron_f.getBalanceUSDT('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', USDT_PAY_WALLET_1);
                pay_wallet_1_usdt_balance = pay_wallet_1_usdt_balance.usdt/1e6;

                let pay_wallet_2_trx_balance = await tron_f.getBalanceTRX(USDT_PAY_WALLET_2);
                pay_wallet_2_trx_balance = pay_wallet_2_trx_balance.trx/1e6;
                let pay_wallet_2_usdt_balance = await tron_f.getBalanceUSDT('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', USDT_PAY_WALLET_2);
                pay_wallet_2_usdt_balance = pay_wallet_2_usdt_balance.usdt/1e6;

                result.push({
                    partnerCode,
                    main_wallet_address: USDT_MAIN_WALLET,
                    main_wallet_usdt_balance,
                    main_wallet_trx_balance,

                    pay_wallet_address: USDT_PAY_WALLET,
                    pay_wallet_usdt_balance,
                    pay_wallet_trx_balance,

                    pay_wallet_1_address: USDT_PAY_WALLET_1,
                    pay_wallet_1_usdt_balance,
                    pay_wallet_1_trx_balance,

                    pay_wallet_2_address: USDT_PAY_WALLET_2,
                    pay_wallet_2_usdt_balance,
                    pay_wallet_2_trx_balance,
                });
            }

            return res.status(200).send({
                status: STATUS_CODE.SUCCESS,
                msg: "SUCCESS",
                data: result
            });
        } else {
            return res.status(200).send({
                status: STATUS_CODE.INVALID_PARAMETER,
                msg: "INVALID PARAMETER",
                data: null
            });
        }
    })

    router.get(`/markets/coin_price`, async (req, res) => {
        const { coin_type } = req.query;

        var tokenHeader = null;
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            tokenHeader = req.headers.authorization.split(' ')[1];
        }

        if(tokenHeader === null || tokenHeader === undefined || tokenHeader.length === 0 || tokenHeader && tokenHeader !== config.SECRET_KEY) {
            return res.status(200).send({
                status: 400,
                msg: "Invalid Token",
            });
        }

        if(!Boolean(coin_type)) {
            return res.status(200).send({
                status: 110,
                data: "You must fill 'coin_type'",
            });
        }

        let ACCESS_KEY = "7b5ac73d6ba7cd60f3fef9d7ad8a927e";
        var link = "http://api.currencylayer.com/live?access_key=" + ACCESS_KEY;
        var data_vnd = await fetch(link);
        data_vnd = await data_vnd.json();
        let usd_vnd = data_vnd.quotes.USDVND;

        try
        {
            if(coin_type === "KDG") {
                var link = "https://api.coingecko.com/api/v3/simple/price?ids=kingdom-game-4-0&vs_currencies=usd";
                var data = await fetch(link);
                data = await data.json();

                return res.status(200).send({
                        status: 1,
                        data: {
                            usd_vnd,
                            data,
                        }
                    });
            }
            else if(coin_type === "TRON") {
                var link = "https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd";
                var data = await fetch(link);
                data = await data.json();

                return res.status(200).send({
                        status: 1,
                        data: {
                            usd_vnd,
                            data,
                        }
                    });
            }
            else if(coin_type === "MCH") {
                var link = "https://api.coingecko.com/api/v3/simple/price?ids=meconcash&vs_currencies=usd";
                var data = await fetch(link);
                data = await data.json();
                
                return res.status(200).send({
                        status: 1,
                        data: {
                            usd_vnd,
                            data,
                        }
                    });
            }
            else if(coin_type === "KNC") {
                var link = "https://api.coingecko.com/api/v3/simple/price?ids=kyber-network&vs_currencies=usd";
                var data = await fetch(link);
                data = await data.json();
                
                return res.status(200).send({
                        status: 1,
                        data: {
                            usd_vnd,
                            data,
                        }
                    });
            }
            else if(coin_type === "ETH") {
                var link = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";
                var data = await fetch(link);
                data = await data.json();

                return res.status(200).send({
                        status: 1,
                        data: {
                            usd_vnd,
                            data,
                        }
                    });
            }
            else if(coin_type === "BTC") {
                var link = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";
                var data = await fetch(link);
                data = await data.json();
                
                return res.status(200).send({
                        status: 1,
                        data: {
                            usd_vnd,
                            data,
                        }
                    });
            }
            else if(coin_type === "USDT") {
                var link = "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd";
                var data = await fetch(link);
                data = await data.json();
                
                return res.status(200).send({
                        status: 1,
                        data: {
                            usd_vnd,
                            usd: data.tether.usd,
                        }
                    });
            }
            else if(coin_type === "TOMO") {
                var link = "https://api.coingecko.com/api/v3/simple/price?ids=tomochain&vs_currencies=usd";
                var data = await fetch(link);
                data = await data.json();
                
                return res.status(200).send({
                        status: 1,
                        data: {
                            usd_vnd,
                            data,
                        }
                    });
            }
            else {
                await 
                    axios
                    .get("https://api.remitano.com/api/v1/markets/" + coin_type + "/order_book")
                    .then(result => {
                        console.log("result")
                        console.log(result.data.bids[0][0])

                        return res.status(200).send({
                            status: 1,
                            data: result.data.bids[0][0],
                        });
                    });
            }
        }
        catch(er){
            console.log("error:", er)
            return res.status(200).send({
                status: 0,
                err: er,
            });
        }
    });
}