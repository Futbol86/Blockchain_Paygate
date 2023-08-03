module.exports = (sequelize, type) => {
	return sequelize.define("lott_trc_usdt_wallet", {
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
		create_date: {
			type: type.DATE
		},
	}, {
		timestamps: false,
		freezeTableName: true,
	})
}