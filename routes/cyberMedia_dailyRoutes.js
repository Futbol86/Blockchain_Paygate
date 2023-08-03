const mysql_function = require('../mysql');
var dateFormat = require('dateformat');
var fs = require('fs');
var EventSource = require('eventsource');
const {Partner, CyberMediaWallet, CyberMediaWalletWithdrawRequest} = require('../sequelize');
const {Op} = require('sequelize');

const fetch = require("node-fetch");
const erc_f = require('../blockchain/custom-libs/erc20_wallet');
const tron_f = require('../blockchain/custom-libs/tron_wallet');

const USDT_CONTRACT = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const USDT_TRC20_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
var moment = require("moment");

var {encrypt, decrypt} = require('../common/security');
const {callback_token_deposit} = require('../common/cyberMedia_actiondb');
var email   = require('../common/email');
var config   = require('../common/config');
var sendEmailDate = new Date();

const PARTNER_WALLETS = require('../common/partnerWallets');
const INTERVAL_CHECK_DEPOSIT = 500;
let startIndex = 0, isRequestingWallets = false; //lastTotal = 0;
let tranferWallets = [];

check_deposit = async(partnerCode) => {
    if(isRequestingWallets === true) return;

    var filter = {
        [Op.and]: [
            {
                partnerCode: partnerCode
            },
            {
                network: "TRC"
            }
        ]
    }

    let findListTRCWallet = await CyberMediaWallet.findAll({ 
        where: filter
    });

    //let total = await CyberMediaWallet.count({ where: filter });
    let length = findListTRCWallet.length;
    console.log('--- length', length);

    // if(length !== lastTotal) {
    //     clearInterval(interval);
    //     startIndex = 0;
    //     isRequestingWallets = false;
    // }
    // lastTotal = length;

    var interval = setInterval(async() => {
        isRequestingWallets = true;

        var address = findListTRCWallet[startIndex].address;
        let balance_usdt = await tron_f.getBalanceUSDT(USDT_TRC20_CONTRACT, address);
        balance_usdt = balance_usdt.usdt/1e6;

        console.log('--- address', address)

        if(balance_usdt >= config.MIN_USDT_DEPOSIT) {
            console.log(' address have usdt', findListTRCWallet[startIndex].address)
            tranferWallets.push(findListTRCWallet[startIndex]);
        }

        if(startIndex === length - 1){
            clearInterval(interval);
            startIndex = 0;
            isRequestingWallets = false;
        }

        startIndex++;
        //console.log(startIndex, address, balance_usdt)
    }, INTERVAL_CHECK_DEPOSIT);
};

tranfer_token_to_admin_wallet = async() => {
    console.log('tranfer_token_to_admin_wallet', tranferWallets.length)
    if(tranferWallets.length === 0) return;

    var wallet = tranferWallets[0];
    var address = wallet.address;
    var pk = decrypt(wallet.privateKey);
    var partnerCode = wallet.partnerCode;

    var USDT_MAIN_WALLET = PARTNER_WALLETS[partnerCode]["USDT_MAIN_WALLET"];
    var USDT_PAY_WALLET = PARTNER_WALLETS[partnerCode]["USDT_PAY_WALLET"];
    var USDT_PAY_PRIVATE_KEY = PARTNER_WALLETS[partnerCode]["USDT_PAY_PRIVATE_KEY"];
   

    let balance_usdt = await tron_f.getBalanceUSDT(USDT_TRC20_CONTRACT, address);
    balance_usdt = parseFloat(balance_usdt.usdt)/1e6;
    balance_usdt = Math.floor(balance_usdt);

    if(balance_usdt >= config.MIN_USDT_DEPOSIT) {
        let balance_trx = await tron_f.getBalanceTRX(address);
        balance_trx = balance_trx.trx/1e6;

        if(balance_trx >= config.MIN_TRX_FEE) {
            var callback_params = {
                res: null,
                userName: null,
                partnerCode, 
                actionType: 'DEPOSIT', 
                toAddress: address, 
                token: "USDT", 
                network: "TRC", 
                value: balance_usdt
            }

            console.log('--- send usdt to', address);
            await tron_f.sendUSDT(pk, USDT_MAIN_WALLET, balance_usdt, callback_token_deposit, callback_params);
            
        } else {
            let balance_trx_wallet_fee = await tron_f.getBalanceTRX(USDT_PAY_WALLET);
            balance_trx_wallet_fee = balance_trx_wallet_fee.trx/1e6;

            if(balance_trx_wallet_fee < 10) {
                var diff_minutes = moment(new Date()).diff(moment(sendEmailDate), 'minutes');
                if(diff_minutes >=5) {
                    sendEmailDate = new Date();
                    var toAddress_Email = config.ADMIN_EMAILS;
                    var subject = 'WALLET FEE IS EMPTY TRX';
                    var text = USDT_PAY_WALLET + " IS EMPTY. PLEASE DEPOSIT MORE!!!!!";
                    await email.send_email(toAddress_Email, subject, text);
                }
                return;
            }

            console.log('--- send trx to', address);
            await tron_f.sendTRX(USDT_PAY_PRIVATE_KEY, USDT_PAY_WALLET, address, parseFloat(config.MIN_TRX_FEE).toFixed(2));
        }
    } else {
        console.log('--- xu ly xong', address);
        tranferWallets.splice(0,1);
    }
}

// check_withdraw_request = async() => {
//     let findAll = await CyberMediaWalletWithdrawRequest.findAll({ 
//         where: {status: 0}
//     });

//     for(var i = 0; i < findAll.length; i++) {
//         var {userName, partnerCode, token, toAddress, value, transId} = findAll[i];
//         var USDT_PAY_WALLET = PARTNER_WALLETS[partnerCode]["USDT_PAY_WALLET"];
//         var USDT_PAY_PRIVATE_KEY = PARTNER_WALLETS[partnerCode]["USDT_PAY_PRIVATE_KEY"];

//         var payload = {userName, partnerCode, USDT_PAY_WALLET, USDT_PAY_PRIVATE_KEY, token, toAddress, value, transId};
//         await withdraw_TRC(payload);
//     }
// }

const withdraw_TRC = async(payload) => {
    var {res, userName, partnerCode, USDT_PAY_WALLET, USDT_PAY_PRIVATE_KEY, token, toAddress, value, transId} = payload;

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

    var callback_params = {userName, partnerCode, actionType: 'WITHDRAW', toAddress, token, network: "TRC", value, transId};
    await tron_f.sendUSDT2(USDT_PAY_PRIVATE_KEY, toAddress, value, callback_token_withdraw, callback_params);
}

module.exports = {
    check_deposit,
    tranfer_token_to_admin_wallet
}