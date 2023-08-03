const Web3 = require('web3');
const Tx = require('ethereumjs-tx').Transaction;
const Link_api = "https://mainnet.infura.io/v3/39fabf1f6e3c4aca8ac4521dd50d20d8"; //99602bdc45dd4a0c95334cbcef557792 
const web3 = new Web3(Link_api);
var axios = require('axios');
var conn = ""; // get tới sql

const USDT_CONTRACT = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const GES_CONTRACT = '0xd667d5a228cb09f190c4308cf89d39cab18a413c';
const BRI_CONTRACT = '0x15470a4ccb61704481fa6a2afd993d585689d226';
const ELD_CONTRACT = '0xf0C6521b1F8ad9C33a99Aaf056F6C6247A3862BA';
const BET_CONTRACT = '0x87230e42ab252c8e752d184051d894ce10a8e819';
const FEE_ERC20 = 0.0025;
const TRX_FEE = 1000000;

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

const showABI = () => {
    const abi = [ { "constant": true, "inputs": [], "name": "name", "outputs": [ { "name": "", "type": "string" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" } ], "name": "approve", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "_from", "type": "address" }, { "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" } ], "name": "transferFrom", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "decimals", "outputs": [ { "name": "", "type": "uint8" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [ { "name": "_owner", "type": "address" } ], "name": "balanceOf", "outputs": [ { "name": "balance", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "symbol", "outputs": [ { "name": "", "type": "string" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" } ], "name": "transfer", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [ { "name": "_owner", "type": "address" }, { "name": "_spender", "type": "address" } ], "name": "allowance", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "payable": true, "stateMutability": "payable", "type": "fallback" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "owner", "type": "address" }, { "indexed": true, "name": "spender", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" } ], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "from", "type": "address" }, { "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" } ], "name": "Transfer", "type": "event" } ];
    return abi;
}

const createERCWallet = async () => {
    var erc20_wallet = await web3.eth.accounts.create();
    return {
        address: erc20_wallet.address,
        privateKey: erc20_wallet.privateKey
    }
}

const sendToken2 = async (tokenContract, fromAddress, privateKey, toAddress, decimals, value, callback, dataCallback, gasPrice = 30, gasLimit = 80000) => {
    let tokenAddress = tokenContract;
    privateKey = Buffer.from(privateKey, 'hex')

    // // Test
    // var txHash = 'abc@123';
    // callback(dataCallback[0], dataCallback[1], dataCallback[2], dataCallback[3], dataCallback[4],  dataCallback[5], txHash);
    // return {
    //   status: 1,
    //   tx: txHash
    // }

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
    if(value <= 0) {
      return {
        status: 0,
        data: "value must greater 0"
      }
    }

    const pricePerToken = web3.utils.toWei('1', 'ether'); 
    const tokenPrice = new web3.utils.BN(pricePerToken).mul(new web3.utils.BN(value));

    let amount = decimals === 6 ? web3.utils.toHex(value* 1e6) : (decimals === 18 ? tokenPrice: tokenPrice)
    let gasPrices = await getCurrentGasPrices();
    var seedTxnCount = await web3.eth.getTransactionCount(fromAddress)

    web3.eth.getTransactionCount(fromAddress, "pending")
      .then((count) => {
        if(seedTxnCount === count) {
            let rawTransaction = {
              'from': fromAddress,
              'gasLimit': web3.utils.toHex(gasLimit),
              'gasPrice': gasPrices.high * 1000000000, 
              'to': tokenAddress,
              'value': 0x0,
              'data': contract.methods.transfer(toAddress, amount).encodeABI(),
              'nonce': web3.utils.toHex(count)
            }
            let transaction = new Tx(rawTransaction)
            transaction.sign(privateKey)
            web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'),  (err, txHash) => {
                console.log("err : ", err);
                console.log("txHash : ", txHash);
                console.log("begin action callback")
                if(txHash !== undefined && txHash !== null) {
                  if(callback !== null && callback !== undefined)
                      callback(dataCallback[0], dataCallback[1], dataCallback[2], dataCallback[3], dataCallback[4], dataCallback[5], txHash);
                } else {
                  if(dataCallback[1] === 'WITHDRAW') {
                    return dataCallback[0].status(200).send({
                        status: 0,
                        msg: "withdraw failed",
                        data: null
                    });
                  }
                }
            });
        } 
        else {
          if(data[1] === 'WITHDRAW') {
            return dataCallback[0].status(200).send({
                status: 0,
                msg: "withdraw failed",
                data: null
            });
          }
        }
      })
}

// callback, dataCallback,
const sendUSDT = async (fromAddress, privateKey, toAddress, value, callback, dataCallback, gas_price) => {
    sendToken2(USDT_CONTRACT, fromAddress, privateKey.replace("0x", ""), toAddress, 6, value, callback, dataCallback, gas_price);
}

const sendGES = async (fromAddress, privateKey, toAddress, value, callback, dataCallback, gas_price) => {
    sendToken2(GES_CONTRACT, fromAddress, privateKey.replace("0x", ""), toAddress, 18, value, callback, dataCallback, gas_price);
}

const sendBRI = async (fromAddress, privateKey, toAddress, value, callback, dataCallback, gas_price) => {
    console.log('--- send BRI', fromAddress, privateKey, toAddress, value)
    sendToken2(BRI_CONTRACT, fromAddress, privateKey.replace("0x", ""), toAddress, 6, value, callback, dataCallback, gas_price);
}

const sendELD = async (fromAddress, privateKey, toAddress, value, callback, dataCallback, gas_price) => {
    sendToken2(ELD_CONTRACT, fromAddress, privateKey.replace("0x", ""), toAddress, 18, value, callback, dataCallback, gas_price);
}

const sendBET = async (fromAddress, privateKey, toAddress, value, callback, dataCallback, gas_price) => {
    sendToken2(BET_CONTRACT, fromAddress, privateKey.replace("0x", ""), toAddress, 18, value, callback, dataCallback, gas_price);
}

const sendETH = async ( fromAddress, privateKey, toAddress, value = FEE_ERC20, gasPrice = 30,gasLimit = 21000) => {
    privateKey = Buffer.from(privateKey, "hex");
   let gasPrices = await getCurrentGasPrices()
   // console.log("gas price:", gasPrices)

    // try {
    var seedTxnCount = await web3.eth.getTransactionCount(fromAddress);
       //const txCount = await web3.eth.getTransactionCount(fromAddress, "pending");
    // console.log("seedTxnCount", seedTxnCount)
    web3.eth.getTransactionCount(fromAddress, "pending")
        .then((count) => {
          // console.log("countansactionCount - count", count)
          // if(seedTxnCount === count) {
            const txObject = {
              nonce: web3.utils.toHex(count),
              to: toAddress,
              value: web3.utils.toHex(web3.utils.toWei(value.toString(), "ether")),
              gasLimit: web3.utils.toHex(gasLimit),
              //gasPrice: 80 * 1000000000, // gasPrices.medium * 1000000000, //web3.utils.toHex(web3.utils.toWei(gasPrice.toString(), "gwei"))
              gasPrice: gasPrices.high * 1000000000, 
            };
            const tx = new Tx(txObject);
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
          // }
        })

    // } catch (error) {
    //     return {
    //         status: 0,
    //         err: error,
    //     };
    // }
};

const getCurrentGasPrices = async () => {
    let response = await axios.get('https://ethgasstation.info/json/ethgasAPI.json')
    let prices = {
      low: response.data.safeLow / 10,
      medium: response.data.average / 10,
      high: response.data.fast / 10
    }
    console.log("prices", prices)
    return prices
}

const getBalanceETH = async (address) => {
    return {
      eth: await web3.eth.getBalance(address),
      //usdt: await getBalanceUSDT(USDT_CONTRACT, address)
    }
}

const getBalanceUSDT = async(address)=>{
    const abi = showABI();
    const contract = new web3.eth.Contract(abi, USDT_CONTRACT);
    const balance =  await contract.methods.balanceOf(address).call();

    return {
        usdt: Number(balance)
    }
}

const getBalanceGES = async(address)=>{
    const abi = showABI();
    const contract = new web3.eth.Contract(abi, GES_CONTRACT);
    const balance =  await contract.methods.balanceOf(address).call();

    return {
        ges: Number(balance)
    }
}

const getBalanceBRI = async(address)=>{
  const abi = showABI();
  const contract = new web3.eth.Contract(abi, BRI_CONTRACT);
  const balance =  await contract.methods.balanceOf(address).call();

  return {
      bri: Number(balance)
  }
}

const getBalanceELD = async(address)=>{
    const abi = showABI();
    const contract = new web3.eth.Contract(abi, ELD_CONTRACT);
    const balance =  await contract.methods.balanceOf(address).call();

    return {
        eld: Number(balance)
    }
}

const getBalanceBET = async(address)=>{
    const abi = showABI();
    const contract = new web3.eth.Contract(abi, BET_CONTRACT);
    const balance =  await contract.methods.balanceOf(address).call();

    return {
        bet: Number(balance)
    }
}

module.exports = {
    createERCWallet: createERCWallet,
    sendETH:        sendETH,
    sendUSDT:       sendUSDT,
    sendGES:        sendGES,
    sendBRI:        sendBRI,
    sendELD:        sendELD,
    sendBET:        sendBET,

    getBalanceETH:  getBalanceETH,
    getBalanceUSDT: getBalanceUSDT,
    getBalanceGES:  getBalanceGES,
    getBalanceBRI:  getBalanceBRI,
    getBalanceELD:  getBalanceELD,
    getBalanceBET:  getBalanceBET,
}