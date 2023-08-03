module.exports = (sequelize, type) => {
	return sequelize.define("partner", {
		id: {
			type: type.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: type.STRING
		},
		partnerCode: {
			type: type.STRING
		},
		allowWithdraw: {
			type: type.BOOLEAN
		},
		callbackUrl: {
			type: type.STRING
		},
		iPWithdraw: {
			type: type.STRING
		},
		create_date: {
			type: type.DATE
		}
	}, {
		timestamps: false,
	})
}