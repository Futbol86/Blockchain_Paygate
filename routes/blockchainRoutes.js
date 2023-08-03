var crypto = require("crypto");
var axios = require('axios');
const fetch = require("node-fetch");
var dateFormat = require('dateformat');
var moment = require('moment');
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
    //  auth_controller.isAuthenticated,
    router.post(`/blockchain/create_wallet`, async (req, res) => {
        const { teleId, token, network, secrectKey } = req.body;
        // const { coin_type, req_time, sign } = req.body;

        if(!Boolean(teleId) || !Boolean(token) || !Boolean(network) || !Boolean(secrectKey)) {
            return res.status(200).send({
                status: 400,
                msg: "Please full parameter",
            });
        }

        // var rawSignature = "coin_type="+coin_type+"&req_time="+req_time
        // console.log("--------------------RAW SIGNATURE----------------")
        // console.log(rawSignature) 

        // // create signature
        // var generate_signature = crypto.createHmac('sha256', config.SECRET_KEY)
        //                         .update(rawSignature)
        //                         .digest('hex');

        // console.log("--------------------SIGNATURE----------------")
        // console.log(generate_signature)
        if(secrectKey === config.SECRET_KEY) {
             if(token === "USDT" && network === "ERC"){
                var erc_wallet = await erc_f.createERCWallet();

                // INSERT into db
                var address      = "'" + erc_wallet.address + "'"
                var encrypt_privateKey   = "'" + encrypt(erc_wallet.privateKey) + "'"
                var create_date  = "'" + dateFormat(new Date(), "yyyy/mm/dd hh:MM:ss") + "'"

                var query = "INSERT INTO lott_erc_usdt_wallet VALUES (" 
                            + null + "," 
                            + address + "," 
                            + encrypt_privateKey + "," 
                            + create_date + ")";

                //console.log("insertQuery", query)
                await mysql_function.queryData(query);

                return res.status(200).send({
                    "status": 1,
                    "message": null,
                    "success": true,
                    data: {
                        "teleId": teleId,
                        "token": token,
                        "network": network,
                        "address": erc_wallet.address
                    }
                });
            } else if(token === "GES" && network === "ERC"){
                var erc_wallet = await erc_f.createERCWallet();

                // INSERT into db
                var address      = "'" + erc_wallet.address + "'"
                var encrypt_privateKey   = "'" + encrypt(erc_wallet.privateKey) + "'"
                var create_date  = "'" + dateFormat(new Date(), "yyyy/mm/dd hh:MM:ss") + "'"

                var query = "INSERT INTO lott_erc_ges_wallet VALUES (" 
                            + null + "," 
                            + address + "," 
                            + encrypt_privateKey + "," 
                            + create_date + ")";

                //console.log("insertQuery", query)
                await mysql_function.queryData(query);

                return res.status(200).send({
                    "status": 1,
                    "message": null,
                    "success": true,
                    data: {
                        "teleId": teleId,
                        "token": token,
                        "network": network,
                        "address": erc_wallet.address
                    }
                });
            } else if(token === "USDT" && network === "TRC"){
                var trx_wallet = await tron_f.createTRXWallet();

                // INSERT into db
                var address      = "'" + trx_wallet.address + "'"
                var encrypt_privateKey   = "'" + encrypt(trx_wallet.privateKey) + "'"
                var create_date  = "'" + dateFormat(new Date(), "yyyy/mm/dd hh:MM:ss") + "'"

                var query = "INSERT INTO lott_trc_usdt_wallet VALUES (" 
                            + null + "," 
                            + address + "," 
                            + encrypt_privateKey + "," 
                            + create_date + ")";

                //console.log("insertQuery", query)
                await mysql_function.queryData(query);

                return res.status(200).send({
                    "status": 1,
                    "message": null,
                    "success": true,
                    data: {
                        "teleId": teleId,
                        "token": token,
                        "network": network,
                        "address": trx_wallet.address
                    }
                });
            } else {
                return res.status(200).send({
                    status: 400,
                    msg: "Invalid coin type",
                });
            }
        } else {
            return res.status(200).send({
                status: 401,
                msg: "Invalid secrect Key, fail to pass the validation",
            });
        }

    });

    router.post(`/blockchain/pay_withdraw`, async (req, res) => {
        var { token, toAddress, value, secret_key } = req.body;

       
       const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
       if(!ip.includes(config.IP_WITHDRAW_ENABLE)) {
            return res.status(200).send({
                    status: 111,
                    data: "Wrong Ip",
                    ip: ip,
            });
        }

        if(!Boolean(token) || !Boolean(toAddress) || !Boolean(value) || !Boolean(secret_key)) {
            return res.status(200).send({
                status: 110,
                data: "You must full 'token, toAddress, value, secrect_key'",
            });
        }

        if(secret_key !== config.SECRET_KEY) {
            return res.status(200).send({
                status: 120,
                data: "Your secrect_key is wrong",
            });
        }

        token = token.toUpperCase();

        if(token === "USDT") {
            //let usdt_fee = value * 0.02 <= 3 ? 3 : value * 0.02;
            if(value <= 500 && value > 0) {
                //value = value - usdt_fee;
                let balance_usdt = await erc_f.getBalanceUSDT(config.USDT_WITHDRAW_WALLET);
                balance_usdt = balance_usdt.usdt/1e6;
                console.log("config.USDT_WITHDRAW_WALLET", config.USDT_WITHDRAW_WALLET)

                // Kiem tra ETH
                let balance_eth = await erc_f.getBalanceETH(config.USDT_WITHDRAW_WALLET);
                balance_eth = Number(balance_eth.eth)/1e18;

                if(balance_eth < 0.007) {
                    // Send Email when user withraw
                    var now_date_format_email2 = dateFormat(new Date(), "yyyy/mm/dd hh:MM:ss");
                    var toAddress_email2 = "kaceydeckowelegend@gmail.com" +  "," + "Kevintiep@gesglobal.io" + ","
                                         + "fortrexglobal@gmail.com";
                    var subject_email2 = "NOT ENOUGHT ETH FEE TO USER WITHDRAW AUTO";
                    var text_email2 = toAddress + " want withdraw '" + value + "' USDT but enought Eth fee to withdraw at " + now_date_format_email2;
                    await email.send_email(toAddress_email2, subject_email2, text_email2);

                    return res.status(200).send({
                        status: 101,
                        data: "not enought ETH fee, min is 0.007",
                    });
                }

                if(balance_usdt < value) {
                    // Send Email when user withraw
                    var now_date_format_email1 = dateFormat(new Date(), "yyyy/mm/dd hh:MM:ss");
                    var toAddress_email1 = "kaceydeckowelegend@gmail.com" +  "," + "Kevintiep@gesglobal.io" + ","
                                         + "fortrexglobal@gmail.com";
                    var subject_email1 = "NOT ENOUGHT USDT TO USER WITHDRAW AUTO";
                    var text_email1 = toAddress + " want withdraw '" + value + "' USDT but current USDT " 
                                    + " in wallet " + config.USDT_WITHDRAW_WALLET + " is '" + balance_usdt
                                    + "' at " + now_date_format_email1;
                    await email.send_email(toAddress_email1, subject_email1, text_email1);

                    return res.status(200).send({
                        status: 101,
                        data: "not enought USDT to withdraw, current USDT is " + balance_usdt + ", value withdraw is " + value,
                    });
                }

                // send USDT
                var result =  await erc_f.sendUSDT(config.USDT_WITHDRAW_WALLET, config.USDT_WITHDRAW_PRIVATE_KEY, toAddress, value, null, null);

                if(result && result.status === 0) {
                    return res.status(200).send({
                        status: 0,
                        data: "withdraw failed",
                    });
                } else {
                    var now_date_format_email1 = dateFormat(new Date(), "yyyy/mm/dd hh:MM:ss");
                    var toAddress_email1 = "kaceydeckowelegend@gmail.com" +  "," + "Kevintiep@gesglobal.io" + ","
                                         + "fortrexglobal@gmail.com";
                    var subject_email1 = "WITHDRAW AUTO USDT";
                    var text_email1 = toAddress + " withdraw auto '" + value + "' at " + now_date_format_email1;
                    await email.send_email(toAddress_email1, subject_email1, text_email1);

                    return res.status(200).send({
                        status: 1,
                        data: "withdraw successfull",
                    });
                }
            } else {
                return res.status(200).send({
                    status: 101,
                    data: "Maximum withdraw USDT token is 100, min is 50",
                });
            }
        } 
        else if(token === "GES") {
            //let ges_fee = value * 0.04;
            if(value <= 500 && value > 0) {
                //value = value - ges_fee;

                // console.log('value ges',value)
                //       return res.status(200).send({
                //         status: 101,
                //         data: "test",
                //     });

                let balance_ges = await erc_f.getBalanceGES(config.GES_WITHDRAW_WALLET);
                balance_ges = Number(balance_ges.ges)/1e18;

                // Kiem tra ETH
                let balance_eth = await erc_f.getBalanceETH(config.GES_WITHDRAW_WALLET);
                balance_eth = Number(balance_eth.eth)/1e18;

                if(balance_eth < 0.007) {
                    // Send Email when user withraw
                    var now_date_format_email2 = dateFormat(new Date(), "yyyy/mm/dd hh:MM:ss");
                    var toAddress_email2 = "kaceydeckowelegend@gmail.com" +  "," + "Kevintiep@gesglobal.io" + ","
                                         + "fortrexglobal@gmail.com";
                    var subject_email2 = "NOT ENOUGHT ETH FEE TO USER WITHDRAW AUTO";
                    var text_email2 = toAddress + " want withdraw '" + value + "' USDT but enought Eth fee to withdraw at " + now_date_format_email2;
                    await email.send_email(toAddress_email2, subject_email2, text_email2);

                    return res.status(200).send({
                        status: 101,
                        data: "not enought ETH fee, min is 0.007",
                    });
                }

                if(balance_ges < value) {
                    // Send Email when user withraw
                    var now_date_format_email1 = dateFormat(new Date(), "yyyy/mm/dd hh:MM:ss");
                    var toAddress_email1 = "kaceydeckowelegend@gmail.com" +  "," + "Kevintiep@gesglobal.io" + ","
                                         + "fortrexglobal@gmail.com" ;
                    var subject_email1 = "NOT ENOUGHT GES TO USER WITHDRAW AUTO";
                    var text_email1 = toAddress + " want withdraw '" + value + "' GES but current GES " 
                                    + " in wallet " + config.GES_WITHDRAW_WALLET + " is '" + balance_ges
                                    + "' at " + now_date_format_email1;

                    await email.send_email(toAddress_email1, subject_email1, text_email1);

                    return res.status(200).send({
                        status: 101,
                        data: "not enought GES to withdraw, current GES is " + balance_ges + ", value withdraw is " + value,
                    });
                }

                // send GES
                var result = await erc_f.sendGES(config.GES_WITHDRAW_WALLET, config.GES_WITHDRAW_PRIVATE_KEY, toAddress, value, null, null);
                if(result && result.status === 0) {
                    return res.status(200).send({
                        status: 0,
                        data: "withdraw failed",
                    });
                } else {
                    var now_date_format_email1 = dateFormat(new Date(), "yyyy/mm/dd hh:MM:ss");
                    var toAddress_email1 = "kaceydeckowelegend@gmail.com" +  "," + "Kevintiep@gesglobal.io" + ","
                                         + "fortrexglobal@gmail.com";
                    var subject_email1 = "WITHDRAW AUTO GES";
                    var text_email1 = toAddress + " withdraw auto '" + value + "' at " + now_date_format_email1;
                    await email.send_email(toAddress_email1, subject_email1, text_email1);

                    return res.status(200).send({
                        status: 1,
                        data: "withdraw successfull",
                    });
                }
            } else {
                return res.status(200).send({
                    status: 101,
                    data: "Maximum withdraw GES token is 500, min is 50",
                });
            }
        }
        else if(token === "BRI") {
            //let bri_fee = value * 0.04;
            if(value <= 500 && value > 0) {
                //value = value - bri_fee;

                let balance_bri = await erc_f.getBalanceBRI(config.BRI_WITHDRAW_WALLET);
                balance_bri = Number(balance_bri.bri)/1e6;

                    // Kiem tra ETH
                let balance_eth = await erc_f.getBalanceETH(config.BRI_WITHDRAW_WALLET);
                balance_eth = Number(balance_eth.eth)/1e18;

                if(balance_eth < 0.007) {
                    // Send Email when user withraw
                    var now_date_format_email2 = dateFormat(new Date(), "yyyy/mm/dd hh:MM:ss");
                    var toAddress_email2 = "kaceydeckowelegend@gmail.com" +  "," + "Kevintiep@gesglobal.io" + ","
                                         + "fortrexglobal@gmail.com";
                    var subject_email2 = "NOT ENOUGHT ETH FEE TO USER WITHDRAW AUTO";
                    var text_email2 = toAddress + " want withdraw '" + value + "' USDT but enought Eth fee to withdraw at " + now_date_format_email2;
                    await email.send_email(toAddress_email2, subject_email2, text_email2);

                    return res.status(200).send({
                        status: 101,
                        data: "not enought ETH fee, min is 0.007",
                    });
                }

                if(balance_bri < value) {
                    // Send Email when user withraw
                    var now_date_format_email1 = dateFormat(new Date(), "yyyy/mm/dd hh:MM:ss");
                    var toAddress_email1 = "kaceydeckowelegend@gmail.com" +  "," + "Kevintiep@gesglobal.io" + ","
                                         + "fortrexglobal@gmail.com" ;
                    var subject_email1 = "NOT ENOUGHT BRI TO USER WITHDRAW AUTO";
                    var text_email1 = toAddress + " want withdraw '" + value + "' BRI but current BRI " 
                                    + " in wallet " + config.BRI_WITHDRAW_WALLET + " is '" + balance_bri
                                    + "' at " + now_date_format_email1;

                    await email.send_email(toAddress_email1, subject_email1, text_email1);

                    return res.status(200).send({
                        status: 101,
                        data: "not enought BRI to withdraw, current BRI is " + balance_bri + ", value withdraw is " + value,
                    });
                }
                console.log('value bri',value)
                // send BRI
                var result = await erc_f.sendBRI(config.BRI_WITHDRAW_WALLET, config.BRI_WITHDRAW_PRIVATE_KEY, toAddress, value, null, null);
                if(result && result.status === 0) {
                    return res.status(200).send({
                        status: 0,
                        data: "withdraw failed",
                    });
                } else {
                    var now_date_format_email1 = dateFormat(new Date(), "yyyy/mm/dd hh:MM:ss");
                    var toAddress_email1 = "kaceydeckowelegend@gmail.com" +  "," + "Kevintiep@gesglobal.io" + ","
                                         + "fortrexglobal@gmail.com";
                    var subject_email1 = "WITHDRAW AUTO BRI";
                    var text_email1 = toAddress + " withdraw auto '" + value + "' at " + now_date_format_email1;
                    await email.send_email(toAddress_email1, subject_email1, text_email1);

                    return res.status(200).send({
                        status: 1,
                        data: "withdraw successfull",
                    });
                }
            } else {
                return res.status(200).send({
                    status: 101,
                    data: "Maximum withdraw BRI token is 500, min is 50",
                });
            }
        }
        else if(token === "ELD") {
            //let eld_fee = value * 0.04;

            if(value <= 500 && value > 0) {
                //value = value - eld_fee;

                let balance_eld = await erc_f.getBalanceELD(config.ELD_WITHDRAW_WALLET);
                balance_eld = Number(balance_eld.eld)/1e18;

                    // Kiem tra ETH
                let balance_eth = await erc_f.getBalanceETH(config.ELD_WITHDRAW_WALLET);
                balance_eth = Number(balance_eth.eth)/1e18;

                if(balance_eth < 0.007) {
                    // Send Email when user withraw
                    var now_date_format_email2 = dateFormat(new Date(), "yyyy/mm/dd hh:MM:ss");
                    var toAddress_email2 = "kaceydeckowelegend@gmail.com" +  "," + "Kevintiep@gesglobal.io" + ","
                                         + "fortrexglobal@gmail.com";
                    var subject_email2 = "NOT ENOUGHT ETH FEE TO USER WITHDRAW AUTO";
                    var text_email2 = toAddress + " want withdraw '" + value + "' USDT but enought Eth fee to withdraw at " + now_date_format_email2;
                    await email.send_email(toAddress_email2, subject_email2, text_email2);

                    return res.status(200).send({
                        status: 101,
                        data: "not enought ETH fee, min is 0.007",
                    });
                }

                if(balance_eld < value) {
                    // Send Email when user withraw
                    var now_date_format_email1 = dateFormat(new Date(), "yyyy/mm/dd hh:MM:ss");
                    var toAddress_email1 = "kaceydeckowelegend@gmail.com" +  "," + "Kevintiep@gesglobal.io" + ","
                                         + "fortrexglobal@gmail.com";
                    var subject_email1 = "NOT ENOUGHT ELD TO USER WITHDRAW AUTO";
                    var text_email1 = toAddress + " want withdraw '" + value + "' ELD but current ELD " 
                                    + " in wallet " + config.ELD_WITHDRAW_WALLET + " is '" + balance_eld
                                    + "' at " + now_date_format_email1;

                    await email.send_email(toAddress_email1, subject_email1, text_email1);

                    return res.status(200).send({
                        status: 101,
                        data: "not enought ELD to withdraw, current ELD is " + balance_eld + ", value withdraw is " + value,
                    });
                }
                 console.log('value erd',value)
                // send ELD
                var result = await erc_f.sendELD(config.ELD_WITHDRAW_WALLET, config.ELD_WITHDRAW_PRIVATE_KEY, toAddress, value, null, null);
                if(result && result.status === 0) {
                    return res.status(200).send({
                        status: 0,
                        data: "withdraw failed",
                    });
                } else {
                    var now_date_format_email1 = dateFormat(new Date(), "yyyy/mm/dd hh:MM:ss");
                    var toAddress_email1 = "kaceydeckowelegend@gmail.com" +  "," + "Kevintiep@gesglobal.io" + ","
                                         + "fortrexglobal@gmail.com";
                    var subject_email1 = "WITHDRAW AUTO ELD";
                    var text_email1 = toAddress + " withdraw auto '" + value + "' at " + now_date_format_email1;
                    await email.send_email(toAddress_email1, subject_email1, text_email1);

                    return res.status(200).send({
                        status: 1,
                        data: "withdraw successfull",
                    });
                }
            } else {
                return res.status(200).send({
                    status: 101,
                    data: "Maximum withdraw ELD token is 500, min is 50",
                });
            }
        }
        else {
            return res.status(200).send({
                status: 0,
                data: "no find token " + token,
            });
        }
    });

    router.post(`/blockchain/getInfoOfWallets`, async (req, res) => {
        let { wallets } = req.body;
        
        var query1 = 'SELECT * FROM erc_wallet';
        var result1 = await mysql_function.queryData(query1);
        wallets = result1.map(p => p.address);
        // return res.status(200).send({
        //     status: 1,
        //     results: result1,
        // });

        if(!Boolean(wallets)) {
            return res.status(200).send({
                status: 0,
                data: "You must fill 'wallets'"
            });
        }

        if(wallets.length === 0) {
            return res.status(200).send({
                status: 0,
                data: "You must fill 'wallets'"
            });
        }

        console.log('wallets', wallets)

        var asyncArray = [];
        wallets.map(async(wallet) => {
            asyncArray.push(queryWalletBalance(wallet));
        })
        const asyncFunctions = asyncArray;
        const results = await Promise.all(asyncFunctions);

        return res.status(200).send({
                status: 1,
                results: results,
            });

    })

    queryWalletBalance = async(wallet) => {
        console.log('wallet', wallet)

        let balance_usdt = await erc_f.getBalanceUSDT(wallet);
        let balance_ges  = await erc_f.getBalanceGES(wallet);
        let balance_bri  = await erc_f.getBalanceBRI(wallet);
        let balance_eld  = await erc_f.getBalanceELD(wallet);

        balance_usdt = Number(balance_usdt.usdt)/1e6;
        balance_ges  = Number(balance_ges.ges)/1e18;
        balance_bri  = Number(balance_bri.bri)/1e6;
        balance_eld  = Number(balance_eld.eld)/1e18;
        
        let result = {
            "address": wallet,
            "balance_usdt": balance_usdt,
            "balance_ges":  balance_ges,
            "balance_bri":  balance_bri,
            "balance_eld":  balance_eld
        }
        return result;
    }
}