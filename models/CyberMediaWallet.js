module.exports = (sequelize, type) => {
	return sequelize.define("cyber_media_wallet", {
		id: {
			type: type.BIGINT,
			primaryKey: true,
			autoIncrement: true
		},
		address: {
			type: type.STRING
		},
		privateKey: {
			type: type.STRING
		},
		partnerCode: {
			type: type.STRING
		},
		token: {
			type: type.STRING
		},
		network: {
			type: type.STRING
		},
		create_date: {
			type: type.DATE
		},
	}, {
		timestamps: false,
		freezeTableName: true,
	})
}