const isValidEmail = require("email-validator").validate;

module.exports = function (state) {
	

	const hasAll = (options) => {
		const input = options.in;

		for (var i = 0; i < options.fields.length; i++) {
			var field = options.fields[i];

			if ( !input.hasOwnProperty(field) )
				return false;
		}
		
		return true;
	};



	const hasOnly = (options) => {
		const input = options.in;

		for ( var field in input ) {
			if ( options.fields.indexOf(field) == -1 )
				return false;
		}

		return true;
	};



	const hasExactly = (options) => {
		return hasAll(options) && hasOnly(options);
	};



	const validateColor = (color, callback) => {
		const requiredFields = ["r", "g", "b", "a"];
		if ( !color ) return callback({ message: "No color" });
		if ( !hasExactly({ fields: requiredFields, in: color }) ) return callback({ message: "Does not specify exactly the required fields" });

		if ( typeof color.r != "number" ) return callback({ message: "Red was not a number" });
		if ( color.r < 0 || color.r > 255 ) return callback({ message: "Red was invalid" });

		if ( typeof color.g != "number" ) return callback({ message: "Green was not a number" });
		if ( color.g < 0 || color.g > 255 ) return callback({ message: "Green was invalid" });

		if ( typeof color.b != "number" ) return callback({ message: "Blue was not a number" });
		if ( color.b < 0 || color.b > 255 ) return callback({ message: "Blue was invalid" });

		if ( typeof color.a != "number" ) return callback({ message: "Alpha was not a number" });
		if ( color.a < 0 || color.a > 1 ) return callback({ message: "Alpha was invalid" });

		return callback(undefined);
	};



	const validatePassword = (password, callback) => {
		if ( typeof password != "string" )
			return callback(false);

		if ( password.length < 5 || password.length > 32 )
			return callback(false);

		callback(true);
	};



	const validateEmail = (email, callback) => {
		const valid = isValidEmail(email);
		callback(valid);
	};



	const validateImage = (image, callback) => {
		if ( typeof image != "string" )
			return callback(false);

		if ( !image )
			return callback(false);

		callback(true);
	};



	const validateUserExists = (id, callback) => {
		if ( !id )
			return callback(false);

		state.database.collection("EnabledUsers").findOne({ _id: id }, (error, user) => {
			if ( error )
				return callback(false);

			const userExists = !!user;
			callback(userExists);
		});
	};



	const validateAdminExists = (id, callback) => {
		if ( !id )
			return callback(false);

		state.database.collection("Administrators").findOne({ _id: id }, (error, admin) => {
			if ( error )
				return callback(false);

			const adminExists = !!admin;
			callback(adminExists);
		});
	};



	const validateNotPastDeadline = (date, deadline, callback) => {
		if ( !date || !deadline ) return callback(false);
		if ( !(date instanceof Date) || !(deadline instanceof Date) ) return callback(false);
		if ( date > deadline ) return callback(false);

		callback(true);
	};
	


	const validatePasswordLogin = (login, callback) => {
		if ( !login ) return callback(false);
		if ( !login.email || !login.password ) return callback(false);

		state.database.collection("Users").findOne({ email: login.email}, (error, user) => {
			if ( error )
				return callback(false);

			if ( !user ) return callback(false);

			return callback(login.password === user.password);
		});
	};



	const validateFacebookLogin = (login, requiredPermissions, callback) => {
		const requiredFields = ["facebookUserId", "token"];

		if ( !login ) return callback(false);
		if ( !hasExactly({ fields: requiredFields, in: login }) ) return callback(false);
		if ( !requiredPermissions ) return callback(false);
		if ( !(requiredPermissions instanceof Array) ) return callback(false);

		state.facebook.loadData(login, (error, data) => {
			if ( error ) return callback(false);

			const validLogin = state.facebook.validateData(login, requiredPermissions, data);
			callback(validLogin);
		});
	};



	const validateAdminLogin = (login, callback) => {
		const requiredFields = ["username", "password"];

		if ( !login ) return callback(false);
		if ( !hasExactly({ fields: requiredFields, in: login }) ) return callback(false);
		
		state.database.collection("Administrators").findOne({ username: login.username }, (error, administrator) => {
			if ( error ) return callback(false);
			if ( !administrator ) return callback(false);

			const passwordMatches = login.password === administrator.password;
			return callback(passwordMatches);
		});
	};



	const parse = (string) => {
		try {
			return JSON.parse(string);
		} catch (e) {
			return undefined;
		}
	};



	const validateAdminLoginHeader = (header, callback) => {
		if ( !header ) return callback(false);
		const login = parse(header);
		state.validator.validate.adminLogin(login, callback);
	};



	const validateUserCredentialHeader = (header, callback) => {
		const requiredFields = ["token"];
		if ( !header ) return callback(false);
		
		const strippedCredential = parse(header);
		if ( !strippedCredential ) return callback(false);
		if ( !hasExactly({ fields: requiredFields, in: strippedCredential }) ) return callback(false);

		state.database.collection("Credentials").findOne({ _id: strippedCredential.token }, (error, credential) => {
            if ( error ) return callback(false);

            state.validator.validate.userCredential(credential, (isValid) => {
                if ( !isValid ) return callback(false);

                return callback(true, credential);
            });
        });
	};



	const validateUserCreationInput = (input, callback) => {
		const requiredFields = ["avatar", "email", "password"];

		if ( !input ) return callback(false);
		if ( !hasExactly({ fields: requiredFields, in: input }) ) return callback(false);
		
		state.validator.validate.image(input.avatar, (validAvatar) => {
			state.validator.validate.email(input.email, (validEmail) => {
				state.validator.validate.password(input.password, (validPassword) => {
					const validInput = validAvatar && validEmail && validPassword
					return callback(validInput);
				});
			});
		});
	};



	const validateUserCredential = (credential, callback) => {
		const requiredFields = ["_id", "role", "userId", "expires"];

		if ( !credential ) return callback(false);
		if ( !hasExactly({ fields: requiredFields, in: credential }) ) return callback(false);
		if ( typeof credential.expires != "number" ) return callback(false);
		if ( credential.role != "User" ) return callback(false);

		const currentDate = state.calendar.now();
		const expirationDate = new Date(credential.expires);
		state.validator.validate.notPastDeadline(currentDate, expirationDate, (validDate) => {
			if ( !validDate ) return callback(false);

			state.validator.validate.userExists(credential.userId, (userExists) => {
				if ( !userExists ) return callback(false);

				callback(true);
			});
		});
	};



	const validateAdminCredential = (credential, callback) => {
		const requiredFields = ["_id", "role", "adminId", "expires"];

		if ( !credential ) return callback(false);
		if ( !hasExactly({ fields: requiredFields, in: credential }) ) return callback(false);
		if ( typeof credential.expires != "number" ) return callback(false);
		if ( credential.role != "Admin" ) return callback(false);

		const currentDate = state.calendar.now();
		const expirationDate = new Date(credential.expires);
		state.validator.validate.notPastDeadline(currentDate, expirationDate, (validDate) => {
			if ( !validDate ) return callback(false);

			state.validator.validate.adminExists(credential.adminId, (adminExists) => {
				if ( !adminExists ) return callback(false);

				callback(true);
			});
		});
	};



	const validateEventChangeInput = (input, callback) => {
		const possibleFields = ["type", "title", "description", "location", "startDate", "endDate"];


		const validateType = (type, callback) => {
			if ( !input.hasOwnProperty("type") ) return callback(undefined);

			if ( !type ) return callback({ message: "'type' does not have a value" });

			state.database.collection("EventTypes").findOne({ _id: type }, (error, eventType) => {
				if ( error ) return callback({ message: error.message });
				if ( !eventType ) return callback({ message: "Event type does not exist" });

				callback(undefined);
			});
		};


		const validateTitle = (title, callback) => {
			if ( !input.hasOwnProperty("title") ) return callback(undefined);

			if ( !title ) return callback({ message: "'title' does not have a value" });
			if ( typeof title != "string" ) return callback({ message: "'title' is not a string" });
			if ( title.length > 100 ) return callback({ message: "'title' is too long" });

			callback(undefined);
		};


		const validateDescription = (description, callback) => {
			if ( !input.hasOwnProperty("description") ) return callback(undefined);

			if ( !description ) return callback({ message: "'description' does not have a value" });
			if ( typeof description != "string" ) return callback({ message: "'description' is not a string" });
			if ( description.length > 1000 ) return callback({ message: "'description' is too long" });

			callback(undefined);
		};


		const validateLocation = (location, callback) => {
			const requiredFields = ["address", "coordinates"];
			if ( !input.hasOwnProperty("location") ) return callback(undefined);

			if ( !location ) return callback({ message: "'location' does not have a value" });
			if ( !hasExactly({ fields: requiredFields, in: location }) ) return callback({ message: "'location' does not have required fields" });

			if ( typeof location.address != "string" ) return callback({ message: "'location.address' is not a string" });
			if ( location.address.length > 200 ) return callback({ message: "'location.address' is too long" });

			if ( !location.coordinates ) return callback({ message: "'location.coordinates' does not have a value" });

			if ( typeof location.coordinates.latitude != "number" ) return callback({ message: "'location.coordinates.latitude' is not a number" });
			if ( location.coordinates.latitude < -90 || location.coordinates.latitude > 90 ) return callback({ message: "'location.coordinates.latitude' is invalid" });

			if ( typeof location.coordinates.longitude != "number" ) return callback({ message: "'location.coordinates.longitude' is not a number" });
			if ( location.coordinates.longitude < -180 || location.coordinates.longitude > 180 ) return callback({ message: "'location.coordinates.longitude' is invalid" });

			callback(undefined);
		};


		const validateDates = (dates, callback) => {
			if ( !input.hasOwnProperty("startDate") && !input.hasOwnProperty("endDate") ) return callback(undefined);

			if ( typeof dates.start != "number" ) return callback({ message: "'startDate' is not a number" });
			if ( typeof dates.end != "number" ) return callback({ message: "'endDate' is not a number" });
			if ( dates.start > dates.end ) return callback({ message: "'startDate' is later than 'endDate'" });

			callback(undefined);
		};


		if ( !input ) return callback({ message: "No input" });
		if ( Object.getOwnPropertyNames(input).length === 0 ) return callback({ message: "No fields specified" });
		if ( !hasOnly({ fields: possibleFields, in: input }) ) return callback({ message: "Unknown fields specified" });

		validateType(input.type, (typeError) => {
			if ( typeError ) return callback(typeError);

			validateTitle(input.title, (titleError) => {
				if ( titleError ) return callback(titleError);

				validateDescription(input.description, (descriptionError) => {
					if ( descriptionError ) return callback(descriptionError);

					validateLocation(input.location, (locationError) => {
						if ( locationError ) return callback(locationError);

						validateDates({ start: input.startDate, end: input.endDate }, (dateError) => {
							if ( dateError ) return callback(dateError);

							callback(undefined);
						});
					});
				});
			});
		});
	};



	const validateEventTypeCreationInput = (input, callback) => {
		const requiredFields = ["name", "color"];
		if ( !input ) return callback({ message: "No input" });
		if ( !hasExactly({ fields: requiredFields, in: input }) ) return callback({ message: "Does not specify exactly the required fields" });

		if ( typeof input.name != "string" ) return callback({ message: "'name' is not a string" });
		if ( !input.name ) return callback({ message: "'name' can not be empty" });

		state.validator.validate.color(input.color, (colorError) => {
			if ( colorError ) return callback({ message: "'color' was invalid" });

			return callback(undefined);
		});
	};



	const validateEventCreationInput = (input, callback) => {
		const requiredFields = ["type", "title", "description", "location", "startDate", "endDate"];


		const validateType = (type, callback) => {
			if ( !type ) return callback({ message: "'type' does not have a value" });

			state.database.collection("EventTypes").findOne({ _id: type }, (error, eventType) => {
				if ( error ) return callback({ message: error.message });
				if ( !eventType ) return callback({ message: "Event type does not exist" });

				callback(undefined);
			});
		};


		const validateTitle = (title, callback) => {
			if ( !title ) return callback({ message: "'title' does not have a value" });
			if ( typeof title != "string" ) return callback({ message: "'title' is not a string" });
			if ( title.length > 100 ) return callback({ message: "'title' is too long" });

			callback(undefined);
		};


		const validateDescription = (description, callback) => {
			if ( !description ) return callback({ message: "'description' does not have a value" });
			if ( typeof description != "string" ) return callback({ message: "'description' is not a string" });
			if ( description.length > 1000 ) return callback({ message: "'description' is too long" });

			callback(undefined);
		};


		const validateLocation = (location, callback) => {
			const requiredFields = ["address", "coordinates"];

			if ( !location ) return callback({ message: "'location' does not have a value" });
			if ( !hasExactly({ fields: requiredFields, in: location }) ) return callback({ message: "'location' does not have required fields" });

			if ( typeof location.address != "string" ) return callback({ message: "'location.address' is not a string" });
			if ( location.address.length > 200 ) return callback({ message: "'location.address' is too long" });

			if ( !location.coordinates ) return callback({ message: "'location.coordinates' does not have a value" });

			if ( typeof location.coordinates.latitude != "number" ) return callback({ message: "'location.coordinates.latitude' is not a number" });
			if ( location.coordinates.latitude < -90 || location.coordinates.latitude > 90 ) return callback({ message: "'location.coordinates.latitude' is invalid" });

			if ( typeof location.coordinates.longitude != "number" ) return callback({ message: "'location.coordinates.longitude' is not a number" });
			if ( location.coordinates.longitude < -180 || location.coordinates.longitude > 180 ) return callback({ message: "'location.coordinates.longitude' is invalid" });

			callback(undefined);
		};


		const validateDates = (dates, callback) => {
			if ( typeof dates.start != "number" ) return callback({ message: "'startDate' is not a number" });
			if ( typeof dates.end != "number" ) return callback({ message: "'endDate' is not a number" });
			if ( dates.start > dates.end ) return callback({ message: "'startDate' is later than 'endDate'" });

			callback(undefined);
		};


		if ( !input ) return callback({ message: "No input" });
		if ( !hasExactly({ fields: requiredFields, in: input }) ) return callback({ message: "Does not specify exactly the required fields" });

		validateType(input.type, (typeError) => {
			if ( typeError ) return callback(typeError);

			validateTitle(input.title, (titleError) => {
				if ( titleError ) return callback(titleError);

				validateDescription(input.description, (descriptionError) => {
					if ( descriptionError ) return callback(descriptionError);

					validateLocation(input.location, (locationError) => {
						if ( locationError ) return callback(locationError);

						validateDates({ start: input.startDate, end: input.endDate }, (dateError) => {
							if ( dateError ) return callback(dateError);

							callback(undefined);
						});
					});
				});
			});
		});
	};



	const validateEventTypeChangeInput = (id, input, callback) => {
		const possibleFields = ["name", "color"];
		if ( typeof id != "string" ) return callback({ message: "Event type id was not a string" });
		if ( !id ) return callback({ message: "Event type id was the empty string" });

		const validateName = (name, callback) => {
			if ( !input.hasOwnProperty("name") ) return callback(undefined);

			if ( typeof name != "string" ) return callback({ message: "'name' was not a string" });
			if ( !name ) return callback({ message: "'name' was the empty string" });
			if ( name.length > 50 ) return callback({ message: "'name' was too long" });

			return callback(undefined);
		};

		const validateColor = (color, callback) => {
			if ( !input.hasOwnProperty("color") ) return callback(undefined);
			state.validator.validate.color(color, (error) => {
				if (error) return callback({ message: "'color' was invalid" });

				return callback(undefined);
			});
		};

		if ( !input ) return callback({ message: "No input" });
		if ( Object.getOwnPropertyNames(input).length === 0 ) return callback({ message: "No fields specified" });
		if ( !hasOnly({ fields: possibleFields, in: input }) ) return callback({ message: "Unknown fields specified" });

		validateName(input.name, (nameError) => {
			if ( nameError ) return callback(nameError);

			validateColor(input.color, (colorError) => {
				if ( colorError ) return callback(colorError);

				callback(undefined);
			});
		});
	};



	const validateSettingsChangeInput = (input, callback) => {
		if ( !input ) return callback({ message: "No input" });
		if ( typeof input.paymentMode != "string" ) return callback({ message: "'paymentMode' was not a string" });
		if ( input.paymentMode != "Free" && input.paymentMode != "Costs" ) return callback({ message: "'paymentMode' was not recognised" });

		return callback(undefined);
	};



	this.validate = {};
	
	this.validate.color = validateColor;
	this.validate.password = validatePassword;
	this.validate.email = validateEmail;
	this.validate.image = validateImage;
	this.validate.userExists = validateUserExists;
	this.validate.adminExists = validateAdminExists;
	this.validate.notPastDeadline = validateNotPastDeadline;
	this.validate.passwordLogin = validatePasswordLogin;
	this.validate.facebookLogin = validateFacebookLogin;
	this.validate.adminLogin = validateAdminLogin;
	this.validate.adminLoginHeader = validateAdminLoginHeader;
	this.validate.userCreationInput = validateUserCreationInput;
	this.validate.userCredential = validateUserCredential;
	this.validate.userCredentialHeader = validateUserCredentialHeader;
	this.validate.adminCredential = validateAdminCredential;

	this.validate.eventCreationInput = validateEventCreationInput;
	this.validate.eventChangeInput = validateEventChangeInput;
	this.validate.eventTypeCreationInput = validateEventTypeCreationInput;
	this.validate.eventTypeChangeInput = validateEventTypeChangeInput;
	this.validate.settingsChangeInput = validateSettingsChangeInput;
	return this;
};