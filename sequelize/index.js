const Sequelize  	 		 = require('sequelize');

const PartnerModel 	 		 				 = require('../models/Partner');
const CyberMediaWalletModel 	 		 	 = require('../models/CyberMediaWallet');
const CyberMediaWalletHistoryModel 	 		 = require('../models/CyberMediaWalletHistory');
const CyberMediaWalletWithdrawRequestModel 	 = require('../models/CyberMediaWalletWithdrawRequest');
const LootTrcWalletModel 	 = require('../models/LootTrcWallet');

var dbConfig = require('../common/dbConfig');
console.log("dbConfig", dbConfig)
const { username, password, database, host, dialect } = dbConfig;

var sequelize = new Sequelize(database, username, password, {
	host: host,
	dialect: dialect,
	pool: {
	    max: 10,
	    min: 0,
	    acquire: 30000,
	    idle: 10000
  	},
  	logging: false
});

// const Partner 	 							= PartnerModel(sequelize, Sequelize);
const CyberMediaWallet 						= CyberMediaWalletModel(sequelize, Sequelize);
// const CyberMediaWalletHistory 	 			= CyberMediaWalletHistoryModel(sequelize, Sequelize);
// const CyberMediaWalletWithdrawRequest		= CyberMediaWalletWithdrawRequestModel(sequelize, Sequelize);
const LootTrcWallet 						= LootTrcWalletModel(sequelize, Sequelize);

module.exports = {
	// Partner,
	CyberMediaWallet,
	// CyberMediaWalletHistory,
	// CyberMediaWalletWithdrawRequest,
	LootTrcWallet
}