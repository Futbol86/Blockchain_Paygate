
var crypto = require("crypto");
const mysql_function = require('../mysql');
var dateFormat = require('dateformat');
const uuid = require('uuid');
const https  = require('https');
// parameters send to Momo
var endpoint = "https://test-payment.momo.vn/gw_payment/transactionProcessor"
var hostname = "https://test-payment.momo.vn"
var path	 = "/gw_payment/transactionProcessor"
var partnerCode = "MOMO";
var accessKey	= "F8BBA842ECF85"
var serectKey   = "K951B6PE1waDMi640xX08PD3vg6EkVlz"
var orderInfo	= "pay with momo"
var returnUrl	= "https://momo.vn/return"
var notifyurl   = "https://callback.url/notify"
var amount	    = '50000'
var orderId		= uuid.v1()
var requestId   = uuid.v1()
var requestType = "captureMoMoWallet"
var extraData   = "merchantName=;merchantId="

var security = require('../common/security');
var config 	 = require('../common/config');

module.exports = (router) => {
    router.post(`/paygate/hmac256`, async (req, res) => {
    	var hmac = crypto.createHmac('sha256', 'futbol86');
    	var data = hmac.update('nguyen-duc-ngoc-hoang');
    	var gen_hmac = data.digest("hex");

        return res.status(200).send({
        	"status" : 1,
            "msg" 	 : gen_hmac
        })
    });

    router.post('/paygate/momo', async(req, res) => {
    	//before sign HMAC SHA256 with format
		//partnerCode=$partnerCode&accessKey=$accessKey&requestId=$requestId&amount=$amount&orderId=$oderId&orderInfo=$orderInfo&returnUrl=$returnUrl&notifyUrl=$notifyUrl&extraData=$extraData
		var rawSignature = "partnerCode="+partnerCode+"&accessKey="+accessKey+"&requestId="+requestId+"&amount="+amount+"&orderId="+orderId+"&orderInfo="+orderInfo+"&returnUrl="+returnUrl+"&notifyUrl="+notifyurl+"&extraData="+extraData
		console.log("--------------------RAW SIGNATURE----------------")
		console.log(rawSignature)

		// create signature
		var signature = crypto.createHmac('sha256', serectKey)
							  .update(rawSignature)
							  .digest('hex');
		console.log("--------------------SIGNATURE----------------")
		console.log(signature)

		var body = JSON.stringify({
			partnerCode : partnerCode,
		    accessKey : accessKey,
		    requestId : requestId,
		    amount : amount,
		    orderId : orderId,
		    orderInfo : orderInfo,
		    returnUrl : returnUrl,
		    notifyUrl : notifyurl,
		    extraData : extraData,
		    requestType : requestType,
		    signature : signature,
		})

		var options = {
			hostname: 'test-payment.momo.vn',
			port: 443,
			path: '/gw_payment/transactionProcessor',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			    'Content-Length': Buffer.byteLength(body)
			}
		}

		console.log("Sending ...")
		var req = https.request(options, (res) => {
		  	console.log(`Status: ${res.statusCode}`);
		  	console.log(`Headers: ${JSON.stringify(res.headers)}`);
		  	res.setEncoding('utf8');
		  	res.on('data', (body) => {
		    	console.log('Body');
		    	console.log(body);
		    	console.log('payURL');
		    	console.log(JSON.parse(body).payUrl);
		  	});

		  	res.on('end', () => {
		    	console.log('No more data in response.');
		  	});
		});

		req.on('error', (e) => {
		  console.log(`problem with request: ${e.message}`);
		});

		// write data to request body
		req.write(body);
		req.end();
    })

    router.post('/paygate/mxc', async(req, res) => {
    	var req_time = new Date().valueOf()
    	var API_URL  = config.MERCHANT_API + 
    	return res.status(200).send({
        	"status" : 1,
            "req_time" 	 : req_time
        })
    })
}