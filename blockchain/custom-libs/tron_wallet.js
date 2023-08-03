const TronWeb = require('tronweb')
const HttpProvider = TronWeb.providers.HttpProvider; // This provider is optional, you can just use a url for the nodes instead
const fullNode = new HttpProvider('https://api.trongrid.io'); // Full node http endpoint
const solidityNode = new HttpProvider('https://api.trongrid.io'); // Solidity node http endpoint
const eventServer = 'https://api.trongrid.io/'; // Contract events http endpoint

const bs58 = require('bs58')

const privateKey = 'da146374a75310b9666e834ee4ad0866d6f4035967bfc76217c5a495fff9f0d0';
const privateKeyNew = '3481E79956D4BD95F358AC96D151C976392FC4E3FC132F78A847906DE588C145';

var conn = "";

const Web3 = require('web3');
const Link_api = 'https://mainnet.infura.io/v3/73707007b7d74be6a1168fff361ee670';
const web3 = new Web3(Link_api);

const tronWeb = new TronWeb(
    fullNode,
    solidityNode,
    eventServer,
    privateKeyNew
);
const TRX_FEE = 10000000;
const KDG_CONTRACT = 'TYM9eM22SCynRc5YaMxE2PX1kwv7H2rXAu';
const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

const mysql_function = require('../../mysql');

async function sqlPromise(sql){
    return new Promise( ( resolve, reject ) => {
              conn.query( sql, ( err, rows ) => {
                  if ( err )
                      return reject( err );
                  resolve( rows );
              } );
          } );
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
}

const waitFor = (ms) => new Promise(r => setTimeout(r, ms));

const sendTRX = async(private, fromAdd, toAdd, amount) => {
  // try
  // {
    //var privateKey = private;
    var fromAddress = fromAdd;
    var toAddress = toAdd;
    amount = amount * 1e6;
    //console.log(private+ "," + fromAddress + "," + toAddress + "," + amount)
    var tradeobj = await tronWeb.transactionBuilder.sendTrx(
      toAddress,
      Math.floor(amount), //- TRX_FEE),
      fromAddress
    );
    const signedtxn = await tronWeb.trx.sign(
      tradeobj,
      private
    );
    const receipt = await tronWeb.trx.sendRawTransaction(
      signedtxn
    ).then(output => {
      console.log('- Output:', output, '\n');
      return {
        status: 1,
        txid: output.txid,
      };
    });
  // }
  // catch(er){
  //     return {
  //         status: 0,
  //         err: er,
  //     };
  // }
}

const sendKDG = async(private, toAdd, amount) => {
  try
  {
    var new_tronWeb = new TronWeb(
      fullNode,
      solidityNode,
      eventServer,
      private
    );
    let contract = await new_tronWeb.contract().at(KDG_CONTRACT);
    // var trx_receiver = (await sqlPromise("select trx_address_receiver from admin_info order by id desc"))[0].trx_address_receiver;
  let xx =  await contract.transfer(toAdd, web3.utils.toWei((amount * 10 ** 9).toString(), "gwei"))
                  .send({feeLimit : TRX_FEE}).then(
                      output => {console.log('- Output:', output, '\n');
                      return {
                        status: 1,
                        output: output,
                      };
                    });

    return {
      status: 1,
      data: xx,
    };
  }
  catch(er){
      return {
          status: 0,
          err: er,
      };
  }
}

const sendUSDT = async(private, toAdd, amount, callback, callback_params) => {
    console.log('---- amount', amount, (amount * 10 ** 9)/1e12)
    let { res, userName, partnerCode, actionType, toAddress, token, network, value } = callback_params || {};
    //console.log('callback_params', callback_params)
    try
    {
      var new_tronWeb = new TronWeb(
        fullNode,
        solidityNode,
        eventServer,
        private
      );



      let contract = await new_tronWeb.contract().at(USDT_CONTRACT);
      let result =  await contract.transfer(toAdd, web3.utils.toWei(((amount * 10 ** 9)/1e12).toString(), "gwei"))
                                  .send({feeLimit : TRX_FEE}).then(
                                      output => {
                                        console.log('- Output:', output, '\n');
                                        console.log('callback', callback)
                                        //callback(res, userName, partnerCode, actionType, toAddress, token, network, value, output);
                                      
                                      return {
                                        status: 1,
                                        output: output,
                                      };
                                    });

      return {
        status: 1,
        data: result,
      };
    } catch(err) {
      console.log('err', err);
      if(res) {
        return res.status(200).send({
            status: 5000,
            msg: "withdraw failed",
            data: err
        });
      }
    }
}

const getUSDTContractInfo = async() => {
  var new_tronWeb = new TronWeb(
    fullNode,
    solidityNode,
    eventServer,
    privateKey
  );

  // let contract = await new_tronWeb.contract().at(USDT_CONTRACT);
  // console.log('contract', contract)

  const parameter = []
  const options = {
    feeLimit:100000000,
    callValue:0
  }

  // const transaction = await new_tronWeb.transactionBuilder.triggerConfirmedConstantContract(USDT_CONTRACT, "name()", options,
  //   parameter,"417946F66D0FC67924DA0AC9936183AB3B07C81126");

 // var list = await new_tronWeb.trx.listExchanges();
 //  console.log('list', list)

  let instance = await new_tronWeb.contract().at(USDT_CONTRACT);
  
  instance.Transfer().watch( async(err, eventResult) => {
      if (err) {
          return console.error('Error with "method" event:', err);
      }
      if (eventResult) { 
          //console.log('eventResult:',eventResult);
          if(eventResult.result.to) {
            var Base58Adress = new_tronWeb.address.fromHex(eventResult.result.to)
            console.log('Base58Adress', Base58Adress)

            var query = "SELECT * FROM cyber_media_wallet WHERE address = '" + Base58Adress + "'";
            var findOne = await mysql_function.queryData(query);
            
            if(findOne && findOne.length !== 0) {
              console.log('findOne', findOne)

            }
          }
      }
    });

  //const bytes = Buffer.from('4195679F3AAF5211991781D49B30525DDDFE9A18DE', 'hex')
  // const address = bs58.decode('TPbBpRXnt6ztse8XkCLiJstZyqQZvxW2sx')
  // console.log('address', address.toString('hex'))

  // var xx = new_tronWeb.address.toHex('TC6BQsUfPaoYh1X1uunzWf9Bkn2ap3P91H')

  // //var xx = await new_tronWeb.fromUtf8("4195679F3AAF5211991781D49B30525DDDFE9A18DE")
  // console.log('xx', xx)

  // var yy = new_tronWeb.address.fromHex('411741d624aba6e2f477e9710a890467dba9ae405b')
  //  console.log('yy', yy)
}

const xx = async() => {
  let balance_usdt = await tron_f.getBalanceUSDT(USDT_TRC20_CONTRACT, address);
  balance_usdt = balance_usdt.usdt/1e6;

  if(balance_usdt >= config.MIN_USDT_DEPOSIT) {
      // Kiem tra TRX
      let balance_trx = await tron_f.getBalanceTRX(address);
      balance_trx = balance_trx.trx/1e6;

      if(balance_trx >= config.MIN_TRX_FEE) {
          await tron_f.sendUSDT(pk, config.TRC_USDT_WALLET_ADMIN_PAYGATE, balance_usdt, callback_token_deposit, [null, null, 'DEPOSIT', address, "USDT", "TRC", balance_usdt]);
      } else {
          // send TRX
          let balance_trx_wallet_fee = await tron_f.getBalanceTRX(config.TRC_WALLET_FEE);
          balance_trx_wallet_fee = balance_trx_wallet_fee.trx/1e6;
          if(balance_trx_wallet_fee < 10) {
              var diff_minutes = moment(new Date()).diff(moment(sendEmailDate), 'minutes');
              if(diff_minutes >=5) {
                  sendEmailDate = new Date();
                  var toAddress_Email = "fortrexglobal@gmail.com" + "," + "Kevintiep@gesglobal.io" + "," + "nguyenducngochoang@gmail.com";
                  var subject = 'WALLET FEE IS EMPTY TRX';
                  var text = config.TRC_WALLET_FEE + " IS EMPTY. PLEASE DEPOSIT MORE!!!!!";
                  await email.send_email(toAddress_Email, subject, text);
              }
              return;
          }

          await tron_f.sendTRX(config.TRC_PRIVATE_KEY_FEE, config.TRC_WALLET_FEE, address, parseFloat(config.MIN_TRX_FEE * 2 - balance_trx).toFixed(2));
      }
  }
}

module.exports = {
    createTRXWallet: async function (){
        var wallet = await tronWeb.createAccount();
        console.log('wallet', wallet)
        return {
          address: wallet.address.base58,
          privateKey: wallet.privateKey
        }
    },
    getAccountFromPrivateKey: async function (privateKey) {
      var address = await tronWeb.address.fromPrivateKey(privateKey);
      return address;
    },
    getBalanceTRX: async function (address){
        return {
          trx: await tronWeb.trx.getBalance(address),
        }
    },
    getBalanceKDG: async function (scAddress, address){
        let contract = await tronWeb.contract().at(scAddress);
        return {
          kdg: await contract.balanceOf(address).call()
        }
    },
    getBalanceUSDT: async function (scAddress, address){
        let contract = await tronWeb.contract().at(scAddress);
        return {
          usdt: await contract.balanceOf(address).call()
        }
    },
    getBalanceTRXAndTRC20: async function (scAddress, address){
        let contract = await tronWeb.contract().at(scAddress);
        return {
          trx: await tronWeb.trx.getBalance(address),
          trc20: await contract.balanceOf(address).call()
        }
    },
    getUnconfirmedTransactionInfo: async function(address) {
      console.log('--- address', address)
      var result = await tronWeb.trx.getUnconfirmedReward(address);
      console.log('--- result', result);
      return result;
    },
    getTransaction: async function(txId) {
      console.log('--- txId', txId)
      var result = await tronWeb.trx.getTransaction(txId);
      console.log('--- result', result);
      return result;
    },
    sendTRX: sendTRX,
    sendTRXToRoot : async function (privateKey, fromAddress, amount ){
        // get trx_address admin
        var trx_receiver = (await sqlPromise("select trx_address_receiver from admin_info order by id desc"))[0].trx_address_receiver;
        var tradeobj = await tronWeb.transactionBuilder.sendTrx(
          trx_receiver,
          Math.floor(amount - TRX_FEE),
          fromAddress
        );
        const signedtxn = await tronWeb.trx.sign(
          tradeobj,
          privateKey
        );
        const receipt = await tronWeb.trx.sendRawTransaction(
          signedtxn
        ).then(output => {console.log('- Output:', output, '\n');});
    },
    sendTRXFEE : async function (address){
        var wallet_fee = (await sqlPromise("select trx_private_send, trx_address_send from admin_info order by id desc"))[0];
        var tradeobj = await tronWeb.transactionBuilder.sendTrx(
          address,
          TRX_FEE,
          wallet_fee.trx_address_send
        );
        const signedtxn = await tronWeb.trx.sign(
          tradeobj,
          wallet_fee.trx_private_send
        );
        const receipt = await tronWeb.trx.sendRawTransaction(
          signedtxn
        ).then(output => {console.log('- Output:', output, '\n');});
    },
    sendKDG: sendKDG,
    sendUSDT: sendUSDT,
    tronWeb:tronWeb,
    getUSDTContractInfo,
}


// Địa chỉ ví pay auto2: INTIME TMs4etRWWQSRHfyN7NBcQnMoaURnCfJSJq
// Private key: 9dbad66caa2539a20e1f2eb9c916ab50bae637341bbf159fde898f37a95ad415