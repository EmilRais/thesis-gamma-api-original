const express = require("express");
const LoginFilter = require("../filters/LoginFilter");

module.exports = (state) => {
	const router = express.Router();
	const Login = LoginFilter(state);
	


	router.post("/", function (request, response) { 

		const validateInput = (login, callback) => {
			state.validator.validate.facebookLogin(login, ["public_profile"], (isValid) => {
				if ( !isValid )
					return response.status(400).end("Input was invalid");

				callback();
			});
		};

		const loadUser = (login, callback) => {
			state.database.collection("EnabledUsers").findOne({ facebookUserId: login.facebookUserId }, (error, user) => {
				if ( error )
					return response.status(500).end("Unable to load user");

				if ( !user )
					return response.status(400).end("User does not exist");

				callback(user);
			});
		};

		const loadCredential = (user, callback) => {
			state.database.collection("Credentials").findOne({ userId: user._id }, (error, credential) => {
				if ( error )
					return response.status(500).end("Unable to load credential");

				callback(credential);
			});
		};

		const deleteCredentialIfAny = (credential, callback) => {
			if ( !credential ) return callback();

			state.database.collection("Credentials").remove({ _id: credential._id }, (error) => {
				if ( error )
					return response.status(500).end("Unable to delete credential");		

				callback();
			});
		};

		const createStoreAndReturnCredential = (user) => {
			const credential = state.factory.createUserCredential(user);
			state.database.collection("Credentials").insert(credential, (error) => {
				if ( error )
					return response.status(500).end("Unable to store credential");

				const strippedCredential = { token: credential._id };
				return response.status(200).json(strippedCredential);
			});
		};


		const login = request.body;
		validateInput(login, () => {
			loadUser(login, (user) => {
				loadCredential(user, (oldCredential) => {
					deleteCredentialIfAny(oldCredential, () => {
						createStoreAndReturnCredential(user);
					});
				});
			});
		});
		
	});



	router.post("/admin", (request, response) => {
		const login = request.body;
		state.validator.validate.adminLogin(login, (isValid) => {
			if ( !isValid )
				return response.status(401).end("Invalid admin login");

			const credential = login;
        	return response.status(200).json(credential);
		});
    });



    router.get("/user", Login.User, (request, response) => {
    	const credential = response.locals.credential;

    	state.database.collection("EnabledUsers").findOne({ _id: credential.userId }, (error, user) => {
    		if ( error ) return response.status(500).end("Error loading user: " + error.message);

    		return response.status(200).json(user);
    	});
    });



	return router;
};
