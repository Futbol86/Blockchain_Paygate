const mysql_function = require('../mysql');
var dateFormat = require('dateformat');
var fs = require('fs');
const path = require('path')
const csv = require('csv-parser');

const fetch = require("node-fetch");
const erc_f = require('../blockchain/custom-libs/erc20_wallet');
const tron_f = require('../blockchain/custom-libs/tron_wallet');
const etherscan_api = "R6UWHB51I91M8H1W9A9C9M26UEYPGV392F";

const USDT_CONTRACT = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const USDT_TRC20_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

var moment = require("moment");
var google_authenticator = require('@authentication/google-authenticator');
const uuid = require('uuid');

var { encrypt, decrypt } = require('../common/security');

const erc_wallet_eth_fee = "0xc36b30e8De3038C11f9851803106503F974539C4";
const privateKey_eth_fee = "e0d5bc6b2be7f1c99180665fdabc88566e04e0870e6c8e1bc762ec240d68e637";


const trc_wallet_fee = "THMBhQ1D4emf1VzHMNfLrLwVJz2H2vgojG";
const trc_privateKey_fee = "7BA7317DCB3616EB70D3FFB55A90532BAE685CE61F87E41EC2F64FCA566B8A94";

const min_USDT_deposit = 1, min_GES_deposit = 20;

const { update_token_deposit } = require('../common/actiondb');
var email   = require('../common/email');
var config   = require('../common/config');

check_deposit_lott_erc_usdt = async() => {
    var query_lott_erc_usdt_wallet = "SELECT * FROM lott_erc_usdt_wallet";
    var findListUser_lott_erc_usdt_wallet = await mysql_function.queryData(query_lott_erc_usdt_wallet);

    console.log(new Date(), "check_deposit lott erc usdt wallet")

    findListUser_lott_erc_usdt_wallet.map( async(p) => {
        try
        {
            var address = p.address;
            var pk = decrypt(p.privateKey);

            // check USDT
            let balance_usdt = await erc_f.getBalanceUSDT(address);
            balance_usdt = balance_usdt.usdt/1e6;

            if(balance_usdt >= 100) {
                // Kiem tra ETH
                let balance_eth = await erc_f.getBalanceETH(address);
                balance_eth = Number(balance_eth.eth)/1e18;

                console.log("check_deposit_lott_erc_usdt", address, balance_usdt, balance_eth)
                if(balance_eth >= 0.007) {
                    await erc_f.sendUSDT(address, pk, config.ERC_USDT_WALLET_ADMIN, balance_usdt, update_token_deposit, [null, 'DEPOSIT', address, "USDT", "ERC", balance_usdt]);
                } else {
                    await erc_f.sendETH(erc_wallet_eth_fee, privateKey_eth_fee, address, 0.015 - balance_eth);
                }
            }
        } catch(err) {
            ;
        }
    })
}

check_deposit_lott_erc_ges = async() => {
    var query_lott_erc_ges_wallet = "SELECT * FROM lott_erc_ges_wallet";
    var findListUser_lott_erc_ges_wallet = await mysql_function.queryData(query_lott_erc_ges_wallet);

    console.log(new Date(), "check_deposit lott erc ges wallet")

    findListUser_lott_erc_ges_wallet.map( async(p) => {
        try
        {
            var address = p.address;
            var pk = decrypt(p.privateKey);

            // check GES
            let balance_ges = await erc_f.getBalanceGES(address);
            balance_ges = balance_ges.ges/1e18;
            console.log("check ges", address, balance_ges)
            if(balance_ges >= 200) {
                // Kiem tra ETH
                let balance_eth = await erc_f.getBalanceETH(address);
                balance_eth = Number(balance_eth.eth)/1e18;

                console.log("check_deposit_lott_erc_ges", address, balance_ges, balance_eth)
                if(balance_eth >= 0.007) {
                    await erc_f.sendGES(address, pk, config.ERC_GES_WALLET_ADMIN, balance_ges, update_token_deposit, [null, 'DEPOSIT', address, "GES", "ERC", balance_ges]);
                } else {
                    await erc_f.sendETH(erc_wallet_eth_fee, privateKey_eth_fee, address, 0.01 - balance_eth);
                }
            }
        } catch(err) {
            ;
        }
    })
}

check_deposit_lott_trc_usdt = async() => {
    console.log(new Date(), "check_deposit lott trc usdt wallet")
    var query_lott_trc_usdt_wallet = "SELECT * FROM lott_trc_usdt_wallet";
    var findListUser_lott_trc_usdt_wallet = await mysql_function.queryData(query_lott_trc_usdt_wallet);

    findListUser_lott_trc_usdt_wallet.map( async(p) => {
        try
        {
            var address = p.address;
            var pk = decrypt(p.privateKey);

            // check USDT
            let balance_usdt = await tron_f.getBalanceUSDT(USDT_TRC20_CONTRACT, address);
            balance_usdt = balance_usdt.usdt/1e6;

            if(balance_usdt >= 5) {
                // Kiem tra TRX
                let balance_trx = await tron_f.getBalanceTRX(address);
                balance_trx = balance_trx.trx/1e6;

                console.log("check_deposit_lott_trc_usdt", address, balance_usdt, balance_trx)

                if(balance_trx >= 1) {
                    await tron_f.sendUSDT(pk, config.TRC_USDT_WALLET_ADMIN, balance_usdt, update_token_deposit, [null, 'DEPOSIT', address, "USDT", "TRC", balance_usdt]);
                } else {
                    await tron_f.sendTRX(trc_privateKey_fee, trc_wallet_fee, address, 3 - balance_trx);
                }
            }
        } catch(err) {
            ;
        }
    })
}

module.exports = {
    check_deposit_lott_erc_usdt: check_deposit_lott_erc_usdt,
    check_deposit_lott_erc_ges: check_deposit_lott_erc_ges,
    check_deposit_lott_trc_usdt: check_deposit_lott_trc_usdt,
}