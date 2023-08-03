const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
var cron = require('node-cron');
const fs = require('fs');
const fetch = require("node-fetch");
var RateLimit = require('express-rate-limit');
var mysql = require('mysql');

const app = express();
const router = express.Router();

app.use(cors());
app.use(bodyParser.json());
app.use('/api', router);
app.use(bodyParser.urlencoded({ extended: true ,limit:'50mb'}));

app.use(express.static("public"));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("*", "*");
    next();
});

require('./routes/cyberMedia_settingRoutes')(router);
require('./routes/cyberMedia_partnerRoutes')(router);
require('./routes/cyberMedia_paygateRoutes')(router);
require('./routes/cyberMedia_privateBankRoutes')(router);
require('./routes/cyberMedia_adminRoutes')(router);
require('./routes/userRoutes')(router);
require('./routes/blockchainRoutes')(router);
require('./routes/depositRoutes')(router);

const dailyRoutes = require('./routes/dailyRoutes');
const cyberMedia_dailyRoutes = require('./routes/cyberMedia_dailyRoutes');

if(process.env.NODE_ENV === 'production'){
    app.use(express.static('client/build'));

    const path = require('path');
}

const PORT = process.env.PORT || 5000;

// cyberMedia_dailyRoutes.check_deposit("EVOLU@VOBZDQROR");

// cron.schedule('*/30 * * * * *', () => {
// 	cyberMedia_dailyRoutes.check_deposit("EVOLU@VOBZDQROR");
//     //cyberMedia_dailyRoutes.tranfer_token_to_admin_wallet();
// });

// cron.schedule('*/20 * * * * *', () => {
//     cyberMedia_dailyRoutes.check_withdraw_request();
// });

// cron.schedule('*/2 * * * *', () => {
//     cyberMedia_dailyRoutes.siglos_follow_received_payments();
// });

app.listen(PORT, () => {
    console.log(`------ BOPayGATE - app running on port ${PORT}`);
});