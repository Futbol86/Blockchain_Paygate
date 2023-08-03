module.exports = (sequelize, type) => {
	return sequelize.define("cyber_media_wallet_history", {
		id: {
			type: type.BIGINT,
			primaryKey: true,
			autoIncrement: true
		},
		address: {
			type: type.STRING
		},
		partnerCode: {
			type: type.STRING
		},
		actionType: {
			type: type.STRING
		},
		token: {
			type: type.STRING
		},
		network: {
			type: type.STRING
		},
		value: {
			type: type.STRING
		},
		txHash: {
			type: type.STRING
		},
		create_date: {
			type: type.DATE
		}
	}, {
		timestamps: false,
		freezeTableName: true,
	})
}