module.exports = (sequelize, type) => {
	return sequelize.define("cyber_media_wallet_withdraw_request", {
		id: {
			type: type.BIGINT,
			primaryKey: true,
			autoIncrement: true
		},
		userName: {
			type: type.STRING
		},
		network: {
			type: type.STRING
		},
		token: {
			type: type.STRING
		},
		toAddress: {
			type: type.STRING
		},
		value: {
			type: type.DOUBLE
		},
		transId: {
			type: type.STRING
		},
		txHash: {
			type: type.STRING
		},
		status: {
			type: type.BOOLEAN
		},
		create_date: {
			type: type.DATE
		}
	}, {
		timestamps: false,
		freezeTableName: true,
	})
}