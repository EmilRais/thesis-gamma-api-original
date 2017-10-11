const agent = require("superagent");



module.exports = (FacebookApp) => {
	return (state) => {



		const validateData = (login, requiredPermissions, data) => {
			const matchesFacebookApp = data.app_id == FacebookApp.appId;
			const matchesUser = data.user_id == login.facebookUserId;
			const expired = data.expires_at * 1000 < state.calendar.now().getTime();
			const valid = data.is_valid;
			const grantedAllPermissions = requiredPermissions.every((value) => { return data.scopes.indexOf(value) != -1 });

			return matchesFacebookApp && matchesUser && !expired && valid && grantedAllPermissions;
		};



		const loadData = (login, callback) => {
			agent
				.get("https://graph.facebook.com/debug_token")
				.query({ input_token: login.token, access_token: FacebookApp.appId + "|" + FacebookApp.appSecret })
				.end((error, response) => {
					if ( error ) return callback(error);
					const data = JSON.parse(response.text).data;

					if ( data.error ) return callback(data.error);
					callback(undefined, data);
				});
		};



		const Facebook = {};
		Facebook.validateData = validateData;
		Facebook.loadData = loadData;
		return Facebook;
	};
};