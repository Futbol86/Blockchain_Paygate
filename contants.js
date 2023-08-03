module.exports = {
	ERROR_CODE: {
 		"400":	"Invalid parameter",
		"401":	"Invalid signature, fail to pass the validation",
		"429":	"Too many requests, rate limit rule is violated",
		"10072":	"Invalid access key",
		"10073":	"Invalid request time",
		"30000":	"Trading is suspended for the requested symbol",
		"30001":	"Current trading type (bid or ask) is not allowed",
		"30002":	"Invalid trading amount, smaller than the symbol minimum trading amount",
		"30003":	"Invalid trading amount, greater than the symbol maximum trading amount",
		"30004":	"Insufficient balance",
		"30005":	"Oversell error",
		"30010":	"Price out of allowed range",
		"30016":	"Market is closed",
		"30019":	"Orders count over limit for batch processing",
		"30020":	"Restricted symbol, API access is not allowed for the time being",
 	},
 	ORDER_STATE: {
	 	"NEW":				"New order, waiting to be filled",
		"FILLED":			"Order fully filled",
		"PARTIALLY_FILLED":	"Order partially filled",
		"CANCELED":			"Order canceled",
		"PARTIALLY_CANCELED	Order": "filled partially, and then the rest of the order is canceled"
 	},
 	TRADE_TYPE: {
 		"BID": "Buy",
 		"ASK": "Sell",
 	}

}