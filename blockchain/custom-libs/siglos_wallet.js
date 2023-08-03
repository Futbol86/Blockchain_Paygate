var dateFormat = require('dateformat');
var moment = require('moment');
const Stellar = require('stellar-sdk');
const HORIZON_ENDPOINT = 'https://horizon.sigloschain.com'; //'https://cyber-horizon.qtv9.tk'
const NETWORK_PASSPHRASE = "Publi Global Siglos Chain; April 2021";
var opts = {};
var server = new Stellar.Server(HORIZON_ENDPOINT, opts);
const config = require('../../common/config');
const STATUS_CODE = require('../../common/statusCode');

const createSIGLOSWallet = async () => {
    const pair = Stellar.Keypair.random();
    let addr = pair.publicKey();

    console.log('pair', pair.publicKey(), pair.secret());
    // console.log('config.SIGLOS_CREATE_ACCOUNT_PRIVATE_KEY', config.SIGLOS_CREATE_ACCOUNT_PRIVATE_KEY)

    //GBQVU7RF2HW55JTRTAM2GVTKK4VTEDGM43LCVRLPK65LOGKDFMGKKVWZ SCWQQJWOFVBYHIXNDJ6QRISZHQAWUG5JEPXNWL2XUSLINB2NCYTYEUWP 
    let sourceKeypair = Stellar.Keypair.fromSecret(config.SIGLOS_CREATE_ACCOUNT_PRIVATE_KEY);
    let sourceAccount = await server.loadAccount(sourceKeypair.publicKey());
    
    let create_account_balance = sourceAccount.balances[0].balance;
    console.log('create_account_balance', create_account_balance)

    if(create_account_balance < 1) {
        return {
            status: STATUS_CODE.NOT_ENOUGHT_VALUE,
            msg: 'NOT_ENOUGHT_VALUE'
        };
    }

    var transaction = new Stellar.TransactionBuilder(sourceAccount, { fee: 200, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(
        Stellar.Operation.createAccount({
        destination: addr,
        startingBalance: (0.2).toString()}))
    .addMemo(Stellar.Memo.text('tao vi'))
    .setTimeout(30)
    .build();
    transaction.sign(sourceKeypair);
    let result = await server.submitTransaction(transaction);

    return {
        status: STATUS_CODE.SUCCESS,
        msg: "SUCCESS",
        address: pair.publicKey(),
        privateKey: pair.secret()
    }
}

const sendSIGLOS = async(privateKey, toAddress, amount, callback, callback_params) => {
    try
    {
        let pair = Stellar.Keypair.fromSecret(privateKey);
        let sourceKeypair = pair;
        let sourceAccount = await server.loadAccount(sourceKeypair.publicKey());
        //phi la 2% don vi la stroop. 1 coin = 10.000.000 stroop.
        let fee = amount * 10000000 * 2 / 100;
        var transaction = new Stellar.TransactionBuilder(sourceAccount, { fee, networkPassphrase: NETWORK_PASSPHRASE })
        .addOperation(
            Stellar.Operation.payment({
            destination: toAddress, //dia chi vi nhan
            asset: Stellar.Asset.native(),
            amount: amount.toString() //dang string, don vi la Coin.
        }))
        .addMemo(Stellar.Memo.text('test payment')) //note chuyen coin
        .setTimeout(30)
        .build();

        transaction.sign(sourceKeypair);
        let result = await server.submitTransaction(transaction);
        var txHash = result.hash;

        if(txHash !== undefined && txHash !== null) {
            if(callback !== null && callback !== undefined) {
                let { res, userName, partnerCode, actionType, toAddress, token, network, value } = callback_params;
                callback(res, userName, partnerCode, actionType, toAddress, token, network, value, txHash);
            }
        }

        return {
            status: 1,
            msg: "success",
            data: txHash,
        };
    } catch (error) {
        console.log(error);
        return {
            status: 0,
            err: error,
        }
    }
}

const getBalanceSIGLOS = async (address) => {
    try
    {
        let sourceAccount = await server.loadAccount(address);

        return sourceAccount.balances[0].balance;
    } catch (error) {
        console.log(error);
        return -1;
    }
}

//GCF523UO3LSYBDH6VZ72MSFWUAKR7IGK5X4KF6CV3AXE5KTPO2AY3SDS SBUPVLNJIM6UQXEHBTWWU5CODQWPVOA4TBMUBF3A2ZC7NBGCAENNQMVF

module.exports = {
    createSIGLOSWallet,
    getBalanceSIGLOS,
    sendSIGLOS,
}