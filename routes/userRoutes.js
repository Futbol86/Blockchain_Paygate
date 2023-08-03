const bcrypt = require('bcrypt');
const saltRounds = 5;
const shordid = require('shortid');

const mysql_function = require('../mysql');
var dateFormat = require('dateformat');

var axios = require('axios');
var moment = require("moment");
var fs = require('fs').promises;
var fs1 = require('fs');
const path = require('path')
const uuid = require('uuid');
const csv = require('csv-parser');

const erc_f = require('../blockchain/custom-libs/erc20_wallet');
const tron_f = require('../blockchain/custom-libs/tron_wallet');
const siglos_wallet_f = require('../blockchain/custom-libs/siglos_wallet');
const bet20_f = require('../blockchain/custom-libs/bet20_wallet');

var md5 = require('md5');
var security = require('../common/security');
var config   = require('../common/config');
var email   = require('../common/email');

const erc_wallet_eth_fee = "0x623A0CDadF165333F34004535b01FB97746Be07D";
const privateKey_eth_fee = "01ee42a829249ca84e1ca1948d3aa2446fe80feaabd0142746e12f261b64f01a";

var { encrypt, decrypt } = require('../common/security');
const { updateUSDTCoin, create_user_transaction, updateWithdrawOrder, payWithdrawOrder, payAutoWithdraw, denyWithdrawOrder } = require('../common/actiondb');

const { CyberMediaWallet, LootTrcWallet } = require('../sequelize');
const USDT_TRC20_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

let startIndex = 0;

module.exports = (router) => {
    router.post(`/test`, async (req, res) => {
      //var siglos_wallet = await siglos_wallet_f.createSIGLOSWallet();
      //https://exp.sigloschain.com/account/GBQVU7RF2HW55JTRTAM2GVTKK4VTEDGM43LCVRLPK65LOGKDFMGKKVWZ
      var balance = await siglos_wallet_f.getBalanceSIGLOS("GBQVU7RF2HW55JTRTAM2GVTKK4VTEDGM43LCVRLPK65LOGKDFMGKKVWZ");

      return res.status(200).send({
        status: 1,
        data: balance, //siglos_wallet
      });

        // console.log("TEST DEPOSIT");

        // const { address } = req.body;

        // var query = 'ALTER TABLE cyber_media_wallet ADD requestAt DATETIME';
        // var result = await mysql_function.queryData(query);

        // let balance_usdt = await tron_f.getBalanceUSDT('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', address);
        // balance_usdt = balance_usdt.usdt/1e6;
        // var query = 'select * from cyber_media_wallet';
        // var result = await mysql_function.queryData(query);

        // return res.status(200).send({
        //     status: 1,
        //     data: result
        // });

        // var address      = "'" + "0x4737B592bACb0bc085FBbCe2417890bE8075EaaD" + "'"
        // var encrypt_privateKey   = "'" + encrypt("7d2b178a6183872e72e206129f37fee8c278a7eb2ae6c4f5169d87ba84cc62c1") + "'"

        // var query = 'UPDATE lott_erc_usdt_wallet set address = ' + address + ', privateKey = ' + encrypt_privateKey 
        //           + ' WHERE address = "0x4737B592bACb0bc085FBbCe2417890bE8075EaaD"';
        // var result = await mysql_function.queryData(query);
        // const data = {
        //     "token": "USDT",
        //     "network": "ERC",
        //     "toAddress": "0xa1b2098Baf05629120C2fcE093Cd3fFC84b35B05",
        //     "transactionId": "26feccf0xxxxxxxy3",
        //     "amount": 13
        // }

        // const token = 'Token 5U^7lWMruu05P?Tp)zXCgy#Cmp97#SBx'
        // var data = {
        //     "actionType":"DEPOSIT",
        //     "partnerCode":"INTIME@WPD-66IXJ",
        //     "token":"SIGLOS",
        //     "network":"SIGLOS",
        //     "toAddress":"GCLJRAR5PVSGKYGBVTAP4Z5T7WRSUFHTTM5UPFDCY2UDQ2GL4BI6DNE6",
        //     "transactionId":"b874f135b3b1210c61ac036682659ad26d7cf4cef3ff96c157f8a9f28e890e87",
        //     "amount":"1.0500000"
        // }

        await axios.get('http://206.189.33.52:5000/api/admin/wallet_histories',{
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer cyber@media*paygate!qwertyuio54321`,
          },
        })
        .then(function(response) {
            return res.status(200).send({
                status: 1,
                data: response.data
            });
        })
        .catch(function(error) {
             console.log('error', error);
        });

        
        // return res.status(200).send({
        //     status: 1,
        //     data: result
        // });

  // var result = await axios.post('https://api-admin.luckylott.live/api/external/deposit', JSON.stringify(data), {
  //         headers: {
  //           'Content-Type': 'application/json',
  //           'Authorization': `Token 5U^7lWMruu05P?Tp)zXCgy#Cmp97#SBx`, //`Basic ` + token
  //         },
  //       })
  //       .then(function(response) {
  //           console.log('response', JSON.stringify(response.data));
  //           return res.status(200).send({
  //               status: 1,
  //               data: JSON.stringify(response.data)
  //           });
  //       })
  //       .catch(function(error) {
  //            console.log('error', error)
  //           // res.send({
  //           //     status: '500',
  //           //     message: error
  //           // })
  //       });


       // var data = {
       //      "actionType":"DEPOSIT",
       //      "partnerCode":"INTIME@WPD-66IXJ",
       //      "token":"SIGLOS",
       //      "network":"SIGLOS",
       //      "toAddress":"GCLJRAR5PVSGKYGBVTAP4Z5T7WRSUFHTTM5UPFDCY2UDQ2GL4BI6DNE6",
       //      "transactionId":"b874f135b3b1210c61ac036682659ad26d7cf4cef3ff96c157f8a9f28e890e87",
       //      "amount":"1.0500000"
       //  }

       //  await axios.post('https://core.intime.click/pay/depositToWallet', JSON.stringify(data), {
       //    headers: {
       //      'Content-Type': 'application/json',
       //      'Authorization': `INTIME@WPD-66IXJ`, //`Basic ` + token
       //    },
       //  })
       //  .then(function(response) {
       //      console.log('response', JSON.stringify(response.data));
       //      return res.status(200).send({
       //          status: 1,
       //          data: JSON.stringify(response.data)
       //      });
       //  })
       //  .catch(function(error) {
       //       console.log('error', error);
       //  });

        
       //  return res.status(200).send({
       //      status: 1,
       //      data: result
       //  });
    });

    // router.post(`/createBNCWallets`, async (req, res) => {
    //     var listWallets = [];

    //     var interval = setInterval(async() => {
    //         console.log('startIndex', startIndex)
    //         var bet20_wallet = await bet20_f.createBET20Wallet();
    //       //  console.log('bet20_wallet', bet20_wallet)
    //         var wallet = {
    //             address: bet20_wallet.address,
    //             privateKey: bet20_wallet.privateKey
    //         }



    //         listWallets.push(wallet);

    //         if(startIndex === 5000){
    //             clearInterval(interval);
    //             //console.log('listWallets', listWallets);
    //             await fs.writeFile('./public/BNC_5000_wallets.js', JSON.stringify(listWallets, null, 4), 'utf8');
    //             startIndex = 0;
    //         }

    //         startIndex++;
    //     }, 100);

    //     return res.status(200).send({
    //         status: 1,
    //         data: "OK"
    //     });
    // })

    router.post(`/getBNCWallets`, async (req, res) => {
        var BNC_wallets_datas = await fs.readFile('./public/BNC_5000_wallets.js', 'utf-8');
        BNC_wallets_datas = JSON.parse(BNC_wallets_datas);
        let index = 0;

        var interval = setInterval(async() => {
            /// USDT
            let balance_usdt = await bet20_f.getBalanceUSDT(BNC_wallets_datas[index].address);
            balance_usdt = balance_usdt.usdt/1e6;

            if(balance_usdt > 2) {
                console.log('--- index', index, BNC_wallets_datas[index].address)
                console.log('----- balance_usdt',  balance_usdt)
            }

          //  console.log('--- index', index, BNC_wallets_datas[index].address)
            index++;

            if(index === BNC_wallets_datas.length) {
                clearInterval(interval);
            }
        }, 250);
        return res.status(200).send({
            status: 1,
            msg: "success"
        });
    })

    router.post(`/getBalanceWallets`, async (req, res) => {
        // let address = "THMBhQ1D4emf1VzHMNfLrLwVJz2H2vgojG";


        let wallets = await LootTrcWallet.findAll({
            where: {},
        })
        let index = 0;
        console.log('--- wallets total: ', wallets.length)

        var interval = setInterval(async() => {
            let balance_trx = await tron_f.getBalanceTRX(wallets[index].address);
            balance_trx = balance_trx.trx/1e6;

            if(balance_trx > 2) {
                //results.push(wallets[index].address, wallets[index].privateKey);

                //var pk = decrypt(wallets[index].privateKey);
                //await tron_f.sendTRX(pk, wallets[index].address, "THMBhQ1D4emf1VzHMNfLrLwVJz2H2vgojG", balance_trx - 1);
                console.log('--- index', index, wallets[index].address)
                // console.log('---- private key', pk)
                console.log('----- balance trx',  balance_trx)
            }

            /// USDT
            let balance_usdt = await tron_f.getBalanceUSDT(USDT_TRC20_CONTRACT, wallets[index].address);
            //console.log('----- balance_usdt',  balance_usdt)
            balance_usdt = balance_usdt.usdt/1e6;

            if(balance_usdt > 2) {
                //results.push(wallets[index].address, wallets[index].privateKey);

                //var pk = decrypt(wallets[index].privateKey);
                //await tron_f.sendTRX(pk, wallets[index].address, "THMBhQ1D4emf1VzHMNfLrLwVJz2H2vgojG", balance_trx - 1);
                console.log('--- index', index, wallets[index].address)
                // console.log('---- private key', pk)
                console.log('----- balance_usdt',  balance_usdt)
            }

            console.log('--- index', index)
            index++;

            if(index === wallets.length) {
                clearInterval(interval);

                return res.status(200).send({
                    status: 1,
                    //data: results
                    msg: "success"
                });
            }
        }, 1000);


        return res.status(200).send({
            status: 1,
            data: wallets.length,
            msg: "success"
        });

        // let index = 0;
        // let results = [];

        // var interval = setInterval(async() => {
        //     if(wallets[index].network === "TRC") {
        //         // let balance_trx = await tron_f.getBalanceTRX(wallets[index].address);
        //         // balance_trx = balance_trx.trx/1e6;

        //         // if(balance_trx > 2) {
                
        //         //     results.push(wallets[index].address, wallets[index].privateKey);

        //         //     var pk = decrypt(wallets[index].privateKey);
        //         //     await tron_f.sendTRX(pk, wallets[index].address, "THMBhQ1D4emf1VzHMNfLrLwVJz2H2vgojG", balance_trx - 1);
        //         //     console.log('--- index', index, wallets[index].address)
        //         //     console.log('---- private key', pk)
        //         //     console.log('----- balance trx',  balance_trx)
        //         // }

        //         /// USDT
        //         let balance_usdt = await tron_f.getBalanceUSDT(USDT_TRC20_CONTRACT, wallets[index].address);
        //         //console.log('----- balance_usdt',  balance_usdt)
        //         balance_usdt = balance_usdt.usdt/1e6;

        //         if(balance_usdt > 2) {
                
        //             results.push(wallets[index].address, wallets[index].privateKey);

        //             //var pk = decrypt(wallets[index].privateKey);
        //             //await tron_f.sendTRX(pk, wallets[index].address, "THMBhQ1D4emf1VzHMNfLrLwVJz2H2vgojG", balance_trx - 1);
        //             console.log('--- index', index, wallets[index].address)
        //             // console.log('---- private key', pk)
        //             console.log('----- balance_usdt',  balance_usdt)
        //         }
        //     }

        //     //console.log('--- index', index)
        //     index++;

        //     if(index === wallets.length) {
        //         clearInterval(interval);

        //         return res.status(200).send({
        //             status: 1,
        //             //data: results
        //             msg: "success"
        //         });
        //     }
        // }, 1000);
    })

    router.post(`/sendTRX`, async (req, res) => {
        let result = await tron_f.sendTRX("7BA7317DCB3616EB70D3FFB55A90532BAE685CE61F87E41EC2F64FCA566B8A94", "THMBhQ1D4emf1VzHMNfLrLwVJz2H2vgojG", "TPb75gUaKG887DxW1Cfk2K73zHCh651j9d", 3800);

        return res.status(200).send({
            status: 1,
            data: result,
            msg: "success"
        });
    });

    router.post(`/sendUSDT`, async (req, res) => {
        let result = await tron_f.sendUSDT("7BA7317DCB3616EB70D3FFB55A90532BAE685CE61F87E41EC2F64FCA566B8A94", "TR1YWfiZw4ygK48oLJhwy2H4z5LuZqLrya", 114, null, null);
        console.log('----- result', result)

        return res.status(200).send({
            status: 1,
            data: result,
            msg: "success"
        });

        // await tron_f.sendTRX("7BA7317DCB3616EB70D3FFB55A90532BAE685CE61F87E41EC2F64FCA566B8A94", "THMBhQ1D4emf1VzHMNfLrLwVJz2H2vgojG", "TChNKTkVDXnH3kDeA6qGqCmyzSmrtCyqGy", 2);

        // // let wallets = ["TChNKTkVDXnH3kDeA6qGqCmyzSmrtCyqGy", "TBEhrJnqC7JKr7rU6h96Xobs8gdeTCaoMT"];
        // // let index = 0;

        // // setInterval(async() => {
        // //     // let balance_trx = await tron_f.getBalanceTRX(item);
        // //     // balance_trx = balance_trx.trx/1e6;

        // //     // console.log('----- balance trx', item, balance_trx)


        // const WALLET = "TChNKTkVDXnH3kDeA6qGqCmyzSmrtCyqGy";
        // let balance_usdt = await tron_f.getBalanceUSDT(USDT_TRC20_CONTRACT, WALLET);
        // //console.log('----- balance_usdt',  balance_usdt)
        // balance_usdt = balance_usdt.usdt/1e6;

        // let findOneWallet = await CyberMediaWallet.findOne({
        //     where: {address: WALLET},
        // });

        // if(findOneWallet) {
        //     //sendUSDT
        //     let result = await tron_f.sendUSDT(decrypt(findOneWallet.privateKey), "THMBhQ1D4emf1VzHMNfLrLwVJz2H2vgojG", balance_usdt, null, null);
        //     console.log('----- result', result)

        //     return res.status(200).send({
        //         status: 1,
        //         data: result,
        //         msg: "success"
        //     });
        // }
    });

    router.post(`/checkKDGWallet`, async (req, res) => {
        let data = fs1.readFileSync(path.join(__dirname, `../public/move_member.txt`), 'utf8');
        let data_JSON = JSON.parse(data);
        let index = 0;

        var interval = setInterval(async() => {
            let trx_address = data_JSON[index].trx_address;

            // TRX
            let balance_trx = await tron_f.getBalanceTRX(trx_address);
            balance_trx = balance_trx.trx/1e6;

            if(balance_trx > 2) {
                console.log('--- index', index, trx_address)
                console.log('----- balance trx',  balance_trx)
            }

            /// USDT
            let balance_usdt = await tron_f.getBalanceUSDT(USDT_TRC20_CONTRACT,trx_address);
            balance_usdt = balance_usdt.usdt/1e6;

            if(balance_usdt > 2) {
                console.log('--- index', index, trx_address)
                // console.log('---- private key', pk)
                console.log('----- balance_usdt',  balance_usdt)
            }

            //console.log('--- index', index, trx_address)
            index++;

            if(index === data_JSON.length) {
                clearInterval(interval);

                return res.status(200).send({
                    status: 1,
                    //data: results
                    msg: "success"
                });
            }
        }, 1000);

        return res.status(200).send({
            status: 1,
            data: data_JSON.length,
            msg: "success"
        });
    });

}