const { ethers } = require('ethers');
var axios = require('axios');
const Provider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed1.binance.org:443');

const Web3 = require('web3');
const Common = require('ethereumjs-common');
const Tx = require('ethereumjs-tx').Transaction;
//const Link_api = "https://bsc-dataseed1.binance.org:443"; //99602bdc45dd4a0c95334cbcef557792 
const Link_api = "https://bsc-dataseed1.binance.org:443"; 
const web3 = new Web3(Link_api);

const FEE_ERC20 = 0.0025;
const TRX_FEE = 1000000;

// rpc: https://docs.binance.org/smart-chain/developer/rpc.html

const showABI = () => {
    const abi = [ { "constant": true, "inputs": [], "name": "name", "outputs": [ { "name": "", "type": "string" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" } ], "name": "approve", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "_from", "type": "address" }, { "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" } ], "name": "transferFrom", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "decimals", "outputs": [ { "name": "", "type": "uint8" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [ { "name": "_owner", "type": "address" } ], "name": "balanceOf", "outputs": [ { "name": "balance", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "symbol", "outputs": [ { "name": "", "type": "string" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" } ], "name": "transfer", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [ { "name": "_owner", "type": "address" }, { "name": "_spender", "type": "address" } ], "name": "allowance", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "payable": true, "stateMutability": "payable", "type": "fallback" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "owner", "type": "address" }, { "indexed": true, "name": "spender", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" } ], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "from", "type": "address" }, { "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" } ], "name": "Transfer", "type": "event" } ];
    return abi;
}

const createBET20Wallet = async () => {
    // const wallet = ethers.Wallet.createRandom();
 
    var bet20_wallet = await web3.eth.accounts.create();

    console.log('address: ', bet20_wallet.address);
    console.log('private: ', bet20_wallet.privateKey);
    return {
        address: bet20_wallet.address,
        privateKey: bet20_wallet.privateKey
    }
}

const getBalanceBNB = async (address) => {
    var balance = await web3.eth.getBalance(address);
    return {
      bnb: Number(balance)
    }
}

const getBalanceUSDT = async(address)=>{
    const abi = showABI();
    const contract = new web3.eth.Contract(abi, '0xe9e7cea3dedca5984780bafc599bd69add087d56');
    const balance =  await contract.methods.balanceOf(address).call();

    return {
        usdt: Number(balance)
    }
}

const sendBNB = async (privateKey, toAddress, value, gasPrice = 30, gasLimit = 21000) => {
    var wallet = web3.eth.accounts.privateKeyToAccount(privateKey);
    var fromAddress = wallet.address;
    //console.log('privateKey 1', privateKey)
    privateKey = privateKey.replace("0x", "");
     //console.log('privateKey 2', privateKey)
    privateKey = Buffer.from(privateKey, "hex");
    let gasPrices = await getCurrentGasPrices();

    //     web3.eth.estimateGas({
    // to: "0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe",
    // data: "0xc6888fa10000000000000000000000000000000000000000000000000000000000000003"
    // })
    // .then(console.log);

   // console.log('BNB gasPrices', gasPrices)

    var seedTxnCount = await web3.eth.getTransactionCount(fromAddress);
    web3.eth.getTransactionCount(fromAddress, "pending")
        .then((count) => {
            const txObject = {
              nonce: web3.utils.toHex(count),
              to: toAddress,
              value: web3.utils.toHex(web3.utils.toWei(value.toString(), "ether")),

              gasLimit: 48000, //web3.utils.toHex(gasLimit),
              gasPrice: 20 * 1000000000, 

              // gasLimit: web3.utils.toHex(gasLimit),
              // gasPrice: gasPrices.high * 1000000000, 
            };

              const common = Common.default.forCustomChain('mainnet', {
              name: 'bnb',
              networkId: 56,
              chainId: 56
            }, 'petersburg');

            const tx = new Tx(txObject, {common});
            tx.sign(privateKey);
            const serializedTx = tx.serialize();
            const raw = "0x" + serializedTx.toString("hex");
            web3.eth.sendSignedTransaction(raw, (err, txHash) => {
                console.log("err : ", err);
                console.log("txHash : ", txHash);
                return {
                    status: 1,
                    tx: txHash
                }
            });
        })
};

const sendToken2 = async (tokenContract, fromAddress, privateKey, toAddress, decimals, value, callback, dataCallback, gasPrice = 30, gasLimit = 80000) => {
    let tokenAddress = tokenContract;
    privateKey = Buffer.from(privateKey, 'hex')


    let contractABI = [
      // transfer
      {
        'constant': false,
        'inputs': [
          {
            'name': '_to',
            'type': 'address'
          },
          {
            'name': '_value',
            'type': 'uint256'
          }
        ],
        'name': 'transfer',
        'outputs': [
          {
            'name': '',
            'type': 'bool'
          }
        ],
        'type': 'function'
      }
    ]

    let contract = new web3.eth.Contract(contractABI, tokenAddress, {from: fromAddress})

   // console.log('fromAddress', fromAddress, value);

    if(value <= 0) {
      return {
        status: 0,
        data: "value must greater 0"
      }
    }

    const pricePerToken = web3.utils.toWei('1', 'ether'); 
    const tokenPrice = new web3.utils.BN(pricePerToken).mul(new web3.utils.BN(value));

    let amount = decimals === 6 ? web3.utils.toHex(value* 1e6) : web3.utils.toHex(value* 1e18);
    let gasPrices = await getCurrentGasPrices();
    var seedTxnCount = await web3.eth.getTransactionCount(fromAddress)

    //console.log('amount', decimals, amount)

    web3.eth.getTransactionCount(fromAddress, "pending")
      .then((count) => {
        // console.log('count', seedTxnCount,count )
        // if(seedTxnCount === count) {
            let rawTransaction = {
              'from': fromAddress,
              'gasLimit': web3.utils.toHex(gasLimit),
              'gasPrice': gasPrices.high * 1000000000, 
              'to': tokenAddress,
              'value': 0x0,
              'data': contract.methods.transfer(toAddress, amount).encodeABI(),
              'nonce': web3.utils.toHex(count),
              // 'chainId': '56',
              // 'networkId': '56'
            }

           // console.log('rawTransaction', rawTransaction)
            // let transaction = new Tx(rawTransaction,{'chain':'ropsten'})
              // 

            const common = Common.default.forCustomChain('mainnet', {
              name: 'bnb',
              networkId: 56,
              chainId: 56
            }, 'petersburg');

            let transaction = new Tx(rawTransaction, {common})
            transaction.sign(privateKey)
            //console.log('transaction', transaction)

            web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'),  (err, txHash) => {
                console.log("err : ", err);
                console.log("txHash : ", txHash);
                //console.log("begin action callback")

                  return {
                  status: 200,
                  data: txHash
                }

                // if(txHash !== undefined && txHash !== null) {
                //   if(callback !== null && callback !== undefined)
                //       callback(dataCallback[0], dataCallback[1], dataCallback[2], dataCallback[3], dataCallback[4], dataCallback[5], txHash);
                // } else {
                //   if(dataCallback && dataCallback[1] === 'WITHDRAW') {
                //     return dataCallback[0].status(200).send({
                //         status: 0,
                //         msg: "withdraw failed",
                //         data: null
                //     });
                //   }
                // }
            });
        // } 
        // else {
        //   // if(data && data[1] === 'WITHDRAW') {
        //     // return dataCallback[0].status(200).send({
        //     //     status: 0,
        //     //     msg: "transaction failed",
        //     //     data: null
        //     // });

        //     return {
        //       status: 0,
        //       msg: "transaction failed",
        //       data: null
        //     }
        //   // }
        // }
      })
}

const sendUSDT = async (privateKey, toAddress, value, callback, dataCallback, gas_price) => {
    const USDT_CONTRACT = '0xe9e7cea3dedca5984780bafc599bd69add087d56';
    var wallet = web3.eth.accounts.privateKeyToAccount(privateKey);
    var fromAddress = wallet.address;

    sendToken2(USDT_CONTRACT, fromAddress, privateKey.replace("0x", ""), toAddress, 18, value, callback, dataCallback, gas_price);
}

const getCurrentGasPrices = async () => {
    let response = await axios.get('https://ethgasstation.info/json/ethgasAPI.json')
    let prices = {
      low: response.data.safeLow / 10,
      medium: response.data.average / 10,
      high: response.data.fast / 10
    }
    //console.log("prices", prices)
    return prices
}

module.exports = {
    createBET20Wallet: createBET20Wallet,

    sendBNB:        sendBNB,
    sendUSDT:       sendUSDT,

    getBalanceBNB:  getBalanceBNB,
    getBalanceUSDT: getBalanceUSDT,
}