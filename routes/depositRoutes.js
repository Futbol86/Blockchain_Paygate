const mysql_function = require('../mysql');
var dateFormat = require('dateformat');

const fetch = require("node-fetch");
const erc_f = require('../blockchain/custom-libs/erc20_wallet');
const tron_f = require('../blockchain/custom-libs/tron_wallet');
const etherscan_api = "R6UWHB51I91M8H1W9A9C9M26UEYPGV392F";

const USDT_CONTRACT = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const USDT_TRC20_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
var moment = require("moment");
var google_authenticator = require('@authentication/google-authenticator');
const uuid = require('uuid');

var security = require('../common/security');

const erc_wallet_eth_fee = "0x4737B592bACb0bc085FBbCe2417890bE8075EaaD";
const privateKey_eth_fee = "7d2b178a6183872e72e206129f37fee8c278a7eb2ae6c4f5169d87ba84cc62c1";

const erc_wallet_admin = "0xf4bc9baD277D9CDa3c9a7d6F4d4DD97ddC7958CA";

const { updateUSDTCoin } = require('../common/actiondb');

module.exports = (router) => {
    // auth_controller.isAuthenticated, 
    router.post(`/deposit`, async (req, res) => {
        const { deposit_type, fromAddress, privateKey, toAddress, value } = req.body;
        console.log('deposit', deposit_type)
        if(!toAddress || value === 0 || toAddress === '' || !value){
            return res.status(200).send({
                status : 0,
                "msg" : 'no wallet or value'
            })
        }

        if(deposit_type === "eth") {
            let balance = await erc_f.getBalanceETH(fromAddress);
            balance = Number(balance.eth)/1e18;
            console.log("balance eth", balance)
            if(balance - value >= 0.007) {
                await erc_f.sendETH(fromAddress, privateKey, toAddress, value);

                return res.status(200).send({
                    status: 1,
                    msg: "success",
                });
            } else {
                return res.status(200).send({
                    status: 0,
                    msg: "no enought ETH token, have: " + balance + ", transfer: " + value,
                });
            }
        }
        else if(deposit_type === "usdt") {
            // check xem có đủ ETH value ko
            let balance_eth = await erc_f.getBalanceETH(fromAddress);
            balance_eth = Number(balance_eth.eth)/1e18;

            if(balance_eth < 0.001) {
                return res.status(200).send({
                    status: 102,
                    msg: "no enought ETH (fee) to transaction",
                });
            }

            // check xem có đủ token value ko
            let balance = await erc_f.getBalanceUSDT(fromAddress);
            balance = balance.usdt/1e6;

            // console.log("balance usdt", balance)
            // console.log("value", value)
           if(balance - value > 0) {
                await erc_f.sendUSDT(fromAddress, privateKey, toAddress, value);
                
                return res.status(200).send({
                    status: 1,
                    msg: "success",
                });
            } else {
                return res.status(200).send({
                    status: 0,
                    msg: "no enought USDT token, have: " + balance + ", transfer: " + value,
                });
            }
        }
        else if(deposit_type === "ges") {
            // check xem có đủ ETH value ko
            let balance_eth = await erc_f.getBalanceETH(fromAddress);
            balance_eth = Number(balance_eth.eth)/1e18;

            console.log("balance_eth", balance_eth)
            if(balance_eth < 0.001) {
                return res.status(200).send({
                    status: 102,
                    msg: "no enought ETH (fee) to transaction",
                });
            }

            // check xem có đủ token GES value ko
            let balance = await erc_f.getBalanceGES(fromAddress);
            balance = balance.ges/1e18;

           if(balance - value > 0) {
                await erc_f.sendGES(fromAddress, privateKey, toAddress, value);
                
                return res.status(200).send({
                    status: 1,
                    msg: "success",
                });
            } else {
                return res.status(200).send({
                    status: 0,
                    msg: "no enought GES token, have: " + balance + ", transfer: " + value,
                });
            }
        }
        else if(deposit_type === "bri") {
            // check xem có đủ ETH value ko
            let balance_eth = await erc_f.getBalanceETH(fromAddress);
            balance_eth = Number(balance_eth.eth)/1e18;

            console.log("balance_eth", balance_eth)
            if(balance_eth < 0.007) {
                return res.status(200).send({
                    status: 102,
                    msg: "no enought ETH (fee) to transaction",
                });
            }

            // check xem có đủ token BRI value ko
            let balance = await erc_f.getBalanceBRI(fromAddress);
            balance = balance.bri/1e6;

           if(balance - value > 0) {
                await erc_f.sendBRI(fromAddress, privateKey, toAddress, value);
                
                return res.status(200).send({
                    status: 1,
                    msg: "success",
                });
            } else {
                return res.status(200).send({
                    status: 0,
                    msg: "no enought BRI token, have: " + balance + ", transfer: " + value,
                });
            }
        }
        else if(deposit_type === "eld") {
            // check xem có đủ ETH value ko
            let balance_eth = await erc_f.getBalanceETH(fromAddress);
            balance_eth = Number(balance_eth.eth)/1e18;

            console.log("balance_eth", balance_eth)
            if(balance_eth < 0.007) {
                return res.status(200).send({
                    status: 102,
                    msg: "no enought ETH (fee) to transaction",
                });
            }

            // check xem có đủ token ELD value ko
            let balance = await erc_f.getBalanceELD(fromAddress);
            balance = balance.eld/1e18;

           if(balance - value > 0) {
                await erc_f.sendELD(fromAddress, privateKey, toAddress, value);
                
                return res.status(200).send({
                    status: 1,
                    msg: "success",
                });
            } else {
                return res.status(200).send({
                    status: 0,
                    msg: "no enought ELD token, have: " + balance + ", transfer: " + value,
                });
            }
        }
        else if(deposit_type === "bet") {
            // check xem có đủ ETH value ko
            let balance_eth = await erc_f.getBalanceETH(fromAddress);
            balance_eth = Number(balance_eth.eth)/1e18;

            console.log("balance_eth", balance_eth)
            if(balance_eth < 0.007) {
                return res.status(200).send({
                    status: 102,
                    msg: "no enought ETH (fee) to transaction",
                });
            }

            // check xem có đủ token ELD value ko
            let balance = await erc_f.getBalanceBET(fromAddress);
            balance = balance.bet/1e18;
            console.log("balance_bet", balance)

           if(balance - value > 0) {
                await erc_f.sendBET(fromAddress, privateKey, toAddress, value);
                
                return res.status(200).send({
                    status: 1,
                    msg: "success",
                });
            } else {
                return res.status(200).send({
                    status: 0,
                    msg: "no enought BET token, have: " + balance + ", transfer: " + value,
                });
            }
        }
        else if(deposit_type === "usdt-trc20") {
            // check xem có đủ token value ko
            let balance_trx = await tron_f.getBalanceTRX(fromAddress);
            balance_trx = balance_trx.trx/1e6;

            if(balance_trx < 1) {
                return res.status(200).send({
                    status: 102,
                    msg: "no enought TRX (fee) to transaction",
                });
            }

            // check xem có đủ token value ko
            let balance = await tron_f.getBalanceUSDT(USDT_TRC20_CONTRACT, fromAddress);
            balance = balance.usdt/1e6;

            console.log("balance USDT-TRC20", balance)
            if(balance - value > 0) {
                let result = await tron_f.sendUSDT(privateKey, toAddress, value, null, null);

                return res.status(200).send({
                    status: 1,
                    data: result,
                });
            } else {
                return res.status(200).send({
                    status: 0,
                    msg: "no enought USDT-TRC20 token, have: " + balance + ", transfer: " + value,
                });
            }
        }
    });

 //  auth_controller.isAuthenticated, 
    router.get(`/blockchain_transaction`, async (req, res) => {
        const { coin_type, address, begin_date, take, skip } = req.query;
        //console.log(req.query)
        try
        {
            if(coin_type === "btc") {
                var link = "https://blockchain.info/rawaddr/" + address + "?skip=" + skip + "&limit=" + take;
                var data = await fetch(link);
                data = await data.json();
                
                return res.status(200).send({
                                            status: 1,
                                            data: data,
                                        });
            }  
            else if(coin_type === "eth") {
                var link = "https://api.etherscan.io/api?module=account&action=txlist&apikey=" + etherscan_api 
                         + "&address=" + address + "&startblock=" + "0" + "&endblock=99999999&sort=desc&offset=" + take + "&page=" + skip;
                var data = await fetch(link);
                data = await data.json();
                
                return res.status(200).send({
                                            status: 1,
                                            data: data,
                                        });
            }
            else if(coin_type === "usdt") {
                var link = "https://api.etherscan.io/api?module=account&action=tokentx&apikey=" + etherscan_api 
                         + "&contractaddress=" + USDT_CONTRACT          
                         + "&address=" + address + "&startblock=" + "0" + "&endblock=99999999&sort=desc&offset=" + take + "&page=" + skip;
                var data = await fetch(link);
                data = await data.json();
                
                return res.status(200).send({
                                            status: 1,
                                            data: data,
                                        });
            }
            else if(coin_type === "knc") {
                var link = "https://api.etherscan.io/api?module=account&action=tokentx&apikey=" + etherscan_api 
                         + "&contractaddress=" + KNC_CONTRACT          
                         + "&address=" + address + "&startblock=" + "0" + "&endblock=99999999&sort=desc&offset=" + take + "&page=" + skip;
                var data = await fetch(link);
                data = await data.json();
                
                return res.status(200).send({
                                            status: 1,
                                            data: data,
                                        });
            }
             else if(coin_type === "mch") {
                var link = "https://api.etherscan.io/api?module=account&action=tokentx&apikey=" + etherscan_api 
                         + "&contractaddress=" + MCH_CONTRACT          
                         + "&address=" + address + "&startblock=" + "0" + "&endblock=99999999&sort=desc&offset=" + take + "&page=" + skip;
                var data = await fetch(link);
                data = await data.json();
                
                return res.status(200).send({
                                            status: 1,
                                            data: data,
                                        });
            }
            else if(coin_type === "tron") {
                // begin_date = "yyyy-mm-dd"
                var date_to_unix = new moment(begin_date).valueOf(); //; moment(new Date()).valueOf();
                console.log("new_unix", date_to_unix);
                var link = "https://apilist.tronscan.org/api/transfer?sort=-timestamp&count=true&limit=" + take + "&start=" + skip + "&token=_&address=" + address;
                // var link = "https://api.trongrid.io/v1/accounts/" + address 
                //         + "/transactions?order_by=block_timestamp,desc&limit=" + take +"&only_to=true&only_confirmed=true&min_timestamp=" + date_to_unix;
                var data = await fetch(link);
                data = await data.json();
                
                return res.status(200).send({
                                            status: 1,
                                            data: data,
                                        });
            }
            else if(coin_type === "kdg") {
                var date_to_unix = new moment(begin_date).valueOf(); //; moment(new Date()).valueOf();
                console.log("new_unix", date_to_unix)
                var link = "https://apilist.tronscan.org/api/contract/events?address=" 
                        + address + "&limit=" + take + "&start_timestamp=" + date_to_unix + "&contract=" + KDG_CONTRACT;
                var data = await fetch(link);
                data = await data.json();
                
                return res.status(200).send({
                                            status: 1,
                                            data: data,
                                        });
            }
            else if(coin_type === "tomo") {
                var link = "https://scan.tomochain.com/api/txs/listByAccount/" + address + "?skip=" + skip + "&limit=" + take;
                var data = await fetch(link);
                data = await data.json();
                
                return res.status(200).send({
                                            status: 1,
                                            data: data,
                                        });
            }
             else if(coin_type === "usdt-trc20") {
                var date_to_unix = new moment(begin_date).valueOf(); //; moment(new Date()).valueOf();
                console.log("new_unix", date_to_unix)
                var link = "https://apilist.tronscan.org/api/contract/events?address=" 
                        + address + "&limit=" + take + "&start_timestamp=" + date_to_unix + "&contract=" + USDT_TRC20_CONTRACT;
                var data = await fetch(link);
                data = await data.json();
                
                return res.status(200).send({
                                            status: 1,
                                            data: data,
                                        });
            }
            else {
                return res.status(200).send({
                    status: 1,
                    err: "wrong coin type",
                });
            }
        }
        catch(er){
            return res.status(200).send({
                                        status: 0,
                                        err: er,
                                    });
        }
    });

    router.post(`/deposit/deposit_to_admin_wallet`, async (req, res) => {
        const { email } = req.body;

        var query = "SELECT * FROM member WHERE Email = '" + email + "'";
        var findUser = await mysql_function.queryData(query);
       // console.log("findUser", findUser)
        if(findUser.length !== 0) {
            var ethAddr_user = findUser[0].ethAddr;
            var privateKey_user = findUser[0].privateKey;

            if(findUser[0].ethAddr === null || findUser[0].ethAddr === undefined) {
                return res.status(200).send({
                    status: 100,
                    data: "email '" + email + "' have not ethAddr. Please create wallet first!"
                }); 
            }

            // check xem có đủ token usdt ko
            let balance_usdt = await erc_f.getBalanceUSDT(ethAddr_user);
            balance_usdt = balance_usdt.usdt/1e6;

            console.log("balance_usdt", balance_usdt)
            if(balance_usdt < 1) {
                return res.status(200).send({
                    status: 100,
                    data: "you must deposit min is 1 USDT"
                });
            }

            // Kiem tra ETH
            let balance_eth = await erc_f.getBalanceETH(ethAddr_user);
            balance_eth = Number(balance_eth.eth)/1e18;

            console.log("balance_eth", balance_eth)

            if(balance_eth >= 0.005) {
                await erc_f.sendUSDT(ethAddr_user, privateKey_user, erc_wallet_admin, balance_usdt, updateUSDTCoin, [findUser[0], "USDT", balance_usdt]);

                return res.status(200).send({
                    status: 1,
                    msg: "success",
                });
            } else {
                //Move 0.01 ETH Fee from Admin to user
                await erc_f.sendETH(erc_wallet_eth_fee, privateKey_eth_fee, ethAddr_user, 0.01);

                return res.status(200).send({
                    status: 1,
                    msg: "send 0.01 ETH Fee from Admin to user success",
                });
            }
        } else {
            return res.status(200).send({
                status: 0,
                data: "email is not exist"
            });
        }
    });
}
