const should = require("chai").should();
const TestState = require("../source/TestState");
const Validator = require("../source/utilities/Validator");

const state = {};
const validator = new Validator(state);

describe("Validator", () => {


	beforeEach(() => {
		TestState.infuse(state);
	});



	describe("validate.color", () => {


		it("Should fail if no color", (done) => {
			const color = undefined;
			validator.validate.color(color, (error) => {
				should.exist(error);
				error.message.should.equal("No color");
				done();
			});
		});


		it("Should fail when missing required fields", (done) => {
			const color = { r: 200, g: 155, b: 180 };
			validator.validate.color(color, (error) => {
				should.exist(error);
				error.message.should.equal("Does not specify exactly the required fields");
				done();
			});
		});


		it("Should fail when unknown fields are specified", (done) => {
			const color = { r: 200, g: 155, b: 180, a: 0.5, unknown: "value" };
			validator.validate.color(color, (error) => {
				should.exist(error);
				error.message.should.equal("Does not specify exactly the required fields");
				done();
			});
		});


		it("Should fail if red is not a number", (done) => {
			const color = { r: "200", g: 155, b: 180, a: 0.5 };
			validator.validate.color(color, (error) => {
				should.exist(error);
				error.message.should.equal("Red was not a number");
				done();
			});
		});


		it("Should fail if red is invalid", (done) => {
			const color = { r: 256, g: 155, b: 180, a: 0.5 };
			validator.validate.color(color, (error) => {
				should.exist(error);
				error.message.should.equal("Red was invalid");
				done();
			});
		});


		it("Should fail if green is not a number", (done) => {
			const color = { r: 200, g: "155", b: 180, a: 0.5 };
			validator.validate.color(color, (error) => {
				should.exist(error);
				error.message.should.equal("Green was not a number");
				done();
			});
		});


		it("Should fail if green is invalid", (done) => {
			const color = { r: 200, g: -155, b: 180, a: 0.5 };
			validator.validate.color(color, (error) => {
				should.exist(error);
				error.message.should.equal("Green was invalid");
				done();
			});
		});


		it("Should fail if blue is not a number", (done) => {
			const color = { r: 200, g: 155, b: "180", a: 0.5 };
			validator.validate.color(color, (error) => {
				should.exist(error);
				error.message.should.equal("Blue was not a number");
				done();
			});
		});


		it("Should fail if blue is invalid", (done) => {
			const color = { r: 200, g: 155, b: 1180, a: 0.5 };
			validator.validate.color(color, (error) => {
				should.exist(error);
				error.message.should.equal("Blue was invalid");
				done();
			});
		});


		it("Should fail if alpha is not a number", (done) => {
			const color = { r: 200, g: 155, b: 180, a: "0.5" };
			validator.validate.color(color, (error) => {
				should.exist(error);
				error.message.should.equal("Alpha was not a number");
				done();
			});
		});


		it("Should fail if alpha is invalid", (done) => {
			const color = { r: 200, g: 155, b: 180, a: 1.5 };
			validator.validate.color(color, (error) => {
				should.exist(error);
				error.message.should.equal("Alpha was invalid");
				done();
			});
		});


		it("Should succeed if valid color", (done) => {
			const color = { r: 200, g: 155, b: 180, a: 0.5 };
			validator.validate.color(color, (error) => {
				should.not.exist(error);
				done();
			});
		});


	});



	describe("validate.passwordLogin", () => {


		it("Should reject if no login", (done) => {
			validator.validate.passwordLogin(undefined, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if no username", (done) => {
			validator.validate.passwordLogin({}, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if no password", (done) => {
			validator.validate.passwordLogin({ password: "" }, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if no user in database", (done) => {
			const login = { email: "peter@mail.com", password: "monkey" };
			validator.validate.passwordLogin(login, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if user's password is different", (done) => {
			const user = { email: "peter@mail.com", password: "donkey" };
			const login = { email: "peter@mail.com", password: "monkey" };
			state.database.collection("Users").insert(user, () => {
				validator.validate.passwordLogin(login, (result) => {
					result.should.be.false;
					done();
				});
			});
		});


		it("Should accept if user's password matches", (done) => {
			const user = { email: "peter@mail.com", password: "monkey" }
			const login = { email: "peter@mail.com", password: "monkey" };
			state.database.collection("Users").insert(user, (error) => {
				validator.validate.passwordLogin(login, (result) => {
					result.should.be.true;
					done();
				});
			});
		});


	});



	describe("validate.facebookLogin", () => {


		it("Should reject if no login", (done) => {
			const login = undefined;
			const requiredPermissions = ["public_profile"];
			validator.validate.facebookLogin(login, requiredPermissions, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if no user id", (done) => {
			const login = { token: "user-token" };
			const requiredPermissions = ["public_profile"];
			validator.validate.facebookLogin(login, requiredPermissions, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if no token", (done) => {
			const login = { facebookUserId: "user-id" };
			const requiredPermissions = ["public_profile"];
			validator.validate.facebookLogin(login, requiredPermissions, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if no required permissions", (done) => {
			const login = { facebookUserId: "user-id", token: "user-token" };
			const requiredPermissions = undefined;
			validator.validate.facebookLogin(login, requiredPermissions, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if required permissions are not in a list", (done) => {
			const login = { facebookUserId: "user-id", token: "user-token" };
			const requiredPermissions = "public_profile";
			validator.validate.facebookLogin(login, requiredPermissions, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if failed loading data", (done) => {
			state.facebook.loadData = (login, callback) => { callback({ message: "An error occured" }) };
			const login = { facebookUserId: "user-id", token: "user-token" };
			const requiredPermissions = ["public_profile"];
			validator.validate.facebookLogin(login, requiredPermissions, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if loaded data is invalid", (done) => {
			state.facebook.validateData = (login, requiredPermissions, data) => { return false };
			const login = { facebookUserId: "user-id", token: "user-token" };
			const requiredPermissions = ["public_profile"];
			validator.validate.facebookLogin(login, requiredPermissions, (result) => {
				result.should.be.false;
				done();
			});
		});
		

		it("Should accept if loaded data is valid", (done) => {
			const login = { facebookUserId: "user-id", token: "user-token" };
			const requiredPermissions = ["public_profile"];
			validator.validate.facebookLogin(login, requiredPermissions, (result) => {
				result.should.be.true;
				done();
			});
		});


	});



	describe("validate.adminLogin", () => {
		it("Should fail if no login", (done) => {
			const login = undefined;
			validator.validate.adminLogin(login, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should fail if username is missing", (done) => {
			const login = { password: "password" };
			validator.validate.adminLogin(login, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should fail if password is missing", (done) => {
			const login = { username: "username" };
			validator.validate.adminLogin(login, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should fail if administrator does not exist", (done) => {
			const login = { username: "username", password: "password" };
			validator.validate.adminLogin(login, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should fail if password does not match", (done) => {
			state.database.collection("Administrators").insert({ username: "admin", password: "password" }, (error) => {
				should.not.exist(error);

				const login = { username: "admin", password: "wrong-password" };
				validator.validate.adminLogin(login, (result) => {
					result.should.be.false;
					done();
				});
			});
		});


		it("Should succeed if username and password matches", (done) => {
			state.database.collection("Administrators").insert({ username: "admin", password: "password" }, (error) => {
				should.not.exist(error);

				const login = { username: "admin", password: "password" };
				validator.validate.adminLogin(login, (result) => {
					result.should.be.true;
					done();
				});
			});
		});


	});



	describe("validate.adminLoginHeader", () => {


		it("Should fail if no header", (done) => {
			const header = undefined;
			validator.validate.adminLoginHeader(header, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should fail if admin login is invalid", (done) => {
			state.validator.validate.adminLogin = (login, callback) => { return callback(false) };
			const header = JSON.stringify({});
			validator.validate.adminLoginHeader(header, (result) => {
				result.should.be.false;
				done();
			});
		});

		
		it("Should succeed if valid admin login header", (done) => {
			const header = JSON.stringify({});
			validator.validate.adminLoginHeader(header, (result) => {
				result.should.be.true;
				done();
			});
		});


	});



	describe("validate.userCredentialHeader", () => {
		

		it("Should fail if no header", (done) => {
			const header = undefined;
			validator.validate.userCredentialHeader(header, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should fail if malformed header", (done) => {
			const header = "malformed";
			validator.validate.userCredentialHeader(header, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should fail if malformed credential", (done) => {
			const header = JSON.stringify({ secret: "credential-id" });
			validator.validate.userCredentialHeader(header, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should fail if invalid credential", (done) => {
			state.validator.validate.userCredential = (credential, callback) => { return callback(false) };
			const header = JSON.stringify({ token: "credential-id" });
			validator.validate.userCredentialHeader(header, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should accept if proper credential", (done) => {
			const header = JSON.stringify({ token: "credential-id" });
			validator.validate.userCredentialHeader(header, (result) => {
				result.should.be.true;
				done();
			});
		});


	});



	describe("validate.userCreationInput", () => {


		it("Should reject if no input", (done) => {
			const input = undefined;
			validator.validate.userCreationInput(input, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if no avatar", (done) => {
			const input = { email: "monkey@mail.com", password: "donkey" };
			validator.validate.userCreationInput(input, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if no email", (done) => {
			const input = { avatar: "monkey", password: "donkey" };
			validator.validate.userCreationInput(input, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if no password", (done) => {
			const input = { avatar: "monkey", email: "monkey@mail.com" };
			validator.validate.userCreationInput(input, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if anything else is added", (done) => {
			const input = { _id: "not-allowed", avatar: "monkey", email: "monkey@mail.com", password: "donkey" };
			validator.validate.userCreationInput(input, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject avatar if not a valid image", (done) => {
			state.validator.validate.image = (image, callback) => { callback(false) };
			const input = { avatar: "monkey", email: "monkey@mail.com", password: "donkey" };
			validator.validate.userCreationInput(input, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject email if not a valid email", (done) => {
			state.validator.validate.email = (email, callback) => { callback(false) };
			const input = { avatar: "monkey", email: "monkey@mail.com", password: "donkey" };
			validator.validate.userCreationInput(input, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject password if not a valid password", (done) => {
			state.validator.validate.password = (password, callback) => { callback(false) };
			const input = { avatar: "monkey", email: "monkey@mail.com", password: "donkey" };
			validator.validate.userCreationInput(input, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should accept if input is valid", (done) => {
			const input = { avatar: "monkey", email: "monkey@mail.com", password: "donkey" };
			validator.validate.userCreationInput(input, (result) => {
				result.should.be.true;
				done();
			});
		});


	});



	describe("validate.userCredential", () => {


		it("Should reject if no credential", (done) => {
			const credential = undefined;
			validator.validate.userCredential(credential, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if no id", (done) => {
			const credential = { role: "User", userId: "user-id", expires: 500 }
			validator.validate.userCredential(credential, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if no role", (done) => {
			const credential = { _id: "credential-id", userId: "user-id", expires: 500 }
			validator.validate.userCredential(credential, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if no user id", (done) => {
			const credential = { _id: "credential-id", role: "User", expires: 500 }
			validator.validate.userCredential(credential, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if no expiration", (done) => {
			const credential = { _id: "credential-id", role: "User", userId: "user-id", expires: undefined };
			validator.validate.userCredential(credential, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if expiration is not a number", (done) => {
			const credential = { _id: "credential-id", role: "User", userId: "user-id", expires: "500" };
			validator.validate.userCredential(credential, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if role is not 'User'", (done) => {
			const credential = { _id: "credential-id", role: "Admin", userId: "user-id", expires: 500 };
			validator.validate.userCredential(credential, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if no matching user", (done) => {
			state.validator.validate.userExists = (id, callback) => { callback(false) };
			const credential = { _id: "credential-id", role: "User", userId: "user-id", expires: 500 };
			validator.validate.userCredential(credential, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if expired", (done) => {
			state.validator.validate.notPastDeadline = (date, deadline, callback) => { callback(false) };
			const credential = { _id: "credential-id", role: "User", userId: "user-id", expires: 500 };
			validator.validate.userCredential(credential, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should accept if valid", (done) => {
			const credential = { _id: "credential-id", role: "User", userId: "user-id", expires: 500 };
			validator.validate.userCredential(credential, (result) => {
				result.should.be.true;
				done();
			});
		});


	});



	describe("validate.adminCredential", () => {


		it("Should reject if no credential", (done) => {
			const credential = undefined;
			validator.validate.adminCredential(credential, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if no id", (done) => {
			const credential = { role: "Admin", adminId: "admin-id", expires: 500 }
			validator.validate.adminCredential(credential, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if no role", (done) => {
			const credential = { _id: "credential-id", adminId: "admin-id", expires: 500 }
			validator.validate.adminCredential(credential, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if no admin id", (done) => {
			const credential = { _id: "credential-id", role: "Admin", expires: 500 }
			validator.validate.adminCredential(credential, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if no expiration", (done) => {
			const credential = { _id: "credential-id", role: "Admin", adminId: "admin-id" };
			validator.validate.adminCredential(credential, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if expiration is not a number", (done) => {
			const credential = { _id: "credential-id", role: "Admin", adminId: "admin-id", expires: "500" };
			validator.validate.adminCredential(credential, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if role is not 'Admin'", (done) => {
			const credential = { _id: "credential-id", role: "User", adminId: "admin-id", expires: 500 };
			validator.validate.adminCredential(credential, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if no matching administrator", (done) => {
			state.validator.validate.adminExists = (id, callback) => { callback(false) };
			const credential = { _id: "credential-id", role: "Admin", adminId: "admin-id", expires: 500 };
			validator.validate.adminCredential(credential, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if expired", (done) => {
			state.validator.validate.notPastDeadline = (date, deadline, callback) => { callback(false) };
			const credential = { _id: "credential-id", role: "Admin", adminId: "admin-id", expires: 500 };
			validator.validate.adminCredential(credential, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should accept if valid", (done) => {
			const credential = { _id: "credential-id", role: "Admin", adminId: "admin-id", expires: 500 };
			validator.validate.adminCredential(credential, (result) => {
				result.should.be.true;
				done();
			});
		});


	});



	describe("validate.password", () => {


		it("Should reject if password is not a string", (done) => {
			validator.validate.password(12345, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if password is shorter than 5 characters", (done) => {
			validator.validate.password("1234", (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if password is longer than 32 characters", (done) => {
			validator.validate.password("123456789012345678901234567890123", (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should accept if password is exactly 5 characters long", (done) => {
			validator.validate.password("doges", (result) => {
				result.should.be.true;
				done();
			});
		});


		it("Should accept if password is exactly 32 characters long", (done) => {
			validator.validate.password("12345678901234567890123456789012", (result) => {
				result.should.be.true;
				done();
			});
		});


		it("Should accept if password is between 5 and 32 characters long", (done) => {
			validator.validate.password("monkeydonkey", (result) => {
				result.should.be.true;
				done();
			});
		});


	});



	describe("validate.email", () => {


		it("Should reject email if not a string", (done) => {
			validator.validate.email(333333, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject email if nothing on the left side of @", (done) => {
			validator.validate.email("@developer.dk", (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject email if nothing on the right side of @", (done) => {
			validator.validate.email("developer@", (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject email if missing domain or global top level domain", (done) => {
			validator.validate.email("developer@com", (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should accept valid email", (done) => {
			validator.validate.email("support@developer.dk", (result) => {
				result.should.be.true;
				done();
			});
		});

	});



	describe("validate.image", () => {


		it("Should reject image if not of type string", (done) => {
			validator.validate.image(12345, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject image if empty", (done) => {
			validator.validate.image("", (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should accept image if valid", (done) => {
			validator.validate.image("valid-image", (result) => {
				result.should.be.true;
				done();
			});
		});


	});



	describe("validate.userExists", () => {


		it("Should reject if no id", (done) => {
			validator.validate.userExists(undefined, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if user does not exist", (done) => {
			validator.validate.userExists("user-id", (result) => {
				result.should.be.false;
				done();
			});
		});

		it("Should accept if user exists", (done) => {
			const user = { _id: "user-id" };
			state.database.collection("EnabledUsers").insert(user, (error) => {
				should.not.exist(error);

				validator.validate.userExists("user-id", (result) => {
					result.should.be.true;
					done();
				});
			});
		});


	});



	describe("validate.adminExists", () => {


		it("Should reject if no id", (done) => {
			validator.validate.adminExists(undefined, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if admin does not exist", (done) => {
			validator.validate.adminExists("admin-id", (result) => {
				result.should.be.false;
				done();
			});
		});

		it("Should accept if admin exists", (done) => {
			const admin = { _id: "admin-id" };
			state.database.collection("Administrators").insert(admin, (error) => {
				should.not.exist(error);

				validator.validate.adminExists("admin-id", (result) => {
					result.should.be.true;
					done();
				});
			});
		});


	});



	describe("validate.notPastDeadline", () => {


		it("Should reject if no date", (done) => {
			const date = undefined;
			const deadline = new Date(1000);
			validator.validate.notPastDeadline(date, deadline, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if no deadline", (done) => {
			const date = new Date(500);
			const deadline = undefined;
			validator.validate.notPastDeadline(date, deadline, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if date is not a date", (done) => {
			const date = 500;
			const deadline = new Date(1000);
			validator.validate.notPastDeadline(date, deadline, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if deadline is not a date", (done) => {
			const date = new Date(500);
			const deadline = 1000;
			validator.validate.notPastDeadline(date, deadline, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should reject if past deadline", (done) => {
			const date = new Date(1001);
			const deadline = new Date(1000);
			validator.validate.notPastDeadline(date, deadline, (result) => {
				result.should.be.false;
				done();
			});
		});


		it("Should accept if on deadline", (done) => {
			const date = new Date(1000);
			const deadline = new Date(1000);
			validator.validate.notPastDeadline(date, deadline, (result) => {
				result.should.be.true;
				done();
			});
		});


		it("Should accept if before deadline", (done) => {
			const date = new Date(999);
			const deadline = new Date(1000);
			validator.validate.notPastDeadline(date, deadline, (result) => {
				result.should.be.true;
				done();
			});
		});


	});



	describe("validate.eventChangeInput", () => {
		

		it("Should fail if no input", (done) => {
			const input = undefined;
			validator.validate.eventChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("No input");
				done();
			});
		});


		it("Should fail if input has unrecognised fields", (done) => {
			const input = { "latitude": 100 };
			validator.validate.eventChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("Unknown fields specified");
				done();
			});
		});


		it("Should fail if input specifies no properties", (done) => {
			const input = {};
			validator.validate.eventChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("No fields specified");
				done();
			});
		});


		it("Should fail if specified type is falsy", (done) => {
			const input = { type: undefined };
			validator.validate.eventChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'type' does not have a value");
				done();
			});
		});


		it("Should fail if specified type does not exist", (done) => {
			const input = { type: "unknown-type" };
			validator.validate.eventChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("Event type does not exist");
				done();
			});
		});


		it("Should succeed if specified type exists", (done) => {
			state.database.collection("EventTypes").insert({ _id: "some-event-type" }, (error) => {
				should.not.exist(error);

				const input = { type: "some-event-type" };
				validator.validate.eventChangeInput(input, (error) => {
					should.not.exist(error);
					done();
				});
			});
		});


		it("Should fail if specified title is empty", (done) => {
			const input = { title: "" };
			validator.validate.eventChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'title' does not have a value");
				done();
			});
		});


		it("Should fail if specified title is not a string", (done) => {
			const input = { title: ["New title"] };
			validator.validate.eventChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'title' is not a string");
				done();
			});
		});


		it("Should fail if title is longer than 100 characters", (done) => {
			const input = { title: "This is a very long title of 101 characters. This is a very long title of 101 characters. This is ver" };
			validator.validate.eventChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'title' is too long");
				done();
			});
		});


		it("Should succeed if specified title is valid", (done) => {
			const input = { title: "This is a valid title" };
			validator.validate.eventChangeInput(input, (error) => {
				should.not.exist(error);
				done();
			});
		});


		it("Should fail if specified description is empty", (done) => {
			const input = { description: "" };
			validator.validate.eventChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'description' does not have a value");
				done();
			});
		});


		it("Should fail if specified description is not a string", (done) => {
			const input = { description: ["This is a description"] };
			validator.validate.eventChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'description' is not a string");
				done();
			});
		});


		it("Should fail if specified description is longer than 1.000 characters", (done) => {
			const input = { description: "This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 charac" };
			validator.validate.eventChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'description' is too long");
				done();
			});
		});


		it("Should succeed if specified description is valid", (done) => {
			const input = { description: "This is a valid description" };
			validator.validate.eventChangeInput(input, (error) => {
				should.not.exist(error);
				done();
			});
		});


		it("Should fail if specified location is falsy", (done) => {
			const input = { location: undefined };
			validator.validate.eventChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'location' does not have a value");
				done();
			});
		});


		it("Should fail if specified location's address is not a string", (done) => {
			const input = { location: { address: 508, coordinates: { latitude: -85, longitude: 100 } } };
			validator.validate.eventChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'location.address' is not a string");
				done();
			});
		});


		it("Should fail if specified location's address is longer than 200 characters", (done) => {
			const address = "This is a very long address longer than 200 characters. This is a very long address longer than 200 characters. This is a very long address longer than 200 characters. This is a very long address longe";
			const input = { location: { address: address, coordinates: { latitude: -85, longitude: 100 } } };
			validator.validate.eventChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'location.address' is too long");
				done();
			});
		});


		it("Should fail if specified location's coordinates are missing", (done) => {
			const input = { location: { address: "This is an address", coordinates: undefined } };
			validator.validate.eventChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'location.coordinates' does not have a value");
				done();
			});
		});


		it("Should fail if specified location's latitude is not a number", (done) => {
			const input = { location: { address: "This is an address", coordinates: { latitude: "-85", longitude: 100 } } };
			validator.validate.eventChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'location.coordinates.latitude' is not a number");
				done();
			});
		});


		it("Should fail if specified location's latitude is invalid", (done) => {
			const input = { location: { address: "This is an address", coordinates: { latitude: -100, longitude: 100 } } };
			validator.validate.eventChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'location.coordinates.latitude' is invalid");
				done();
			});
		});


		it("Should fail if specified location's longitude is not a number", (done) => {
			const input = { location: { address: "This is an address", coordinates: { latitude: -85, longitude: "100" } } };
			validator.validate.eventChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'location.coordinates.longitude' is not a number");
				done();
			});
		});


		it("Should fail if specified location's longitude is invalid", (done) => {
			const input = { location: { address: "This is an address", coordinates: { latitude: -85, longitude: 190 } } };
			validator.validate.eventChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'location.coordinates.longitude' is invalid");
				done();
			});
		});
		

		it("Should succeed if specified location is valid", (done) => {
			const input = { location: { address: "This is an address", coordinates: { latitude: -85, longitude: 100 } } };
			validator.validate.eventChangeInput(input, (error) => {
				should.not.exist(error);
				done();
			});
		});


		it("Should fail if specified start date is not a number", (done) => {
			const input = { startDate: "50", endDate: 100 };
			validator.validate.eventChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'startDate' is not a number");
				done();
			});
		});


		it("Should fail if specified end date is not a number", (done) => {
			const input = { startDate: 50, endDate: "100" };
			validator.validate.eventChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'endDate' is not a number");
				done();
			});
		});


		it("Should fail if specified start date is after end date", (done) => {
			const input = { startDate: 100, endDate: 50 };
			validator.validate.eventChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'startDate' is later than 'endDate'");
				done();
			});
		});
		

		it("Should succeed if specified dates are valid", (done) => {
			const input = { startDate: 50, endDate: 100 };
			validator.validate.eventChangeInput(input, (error) => {
				should.not.exist(error);
				done();
			});
		});


		it("Should fail if specifying a valid and invalid property", (done) => {
			const input = { title: "New title", description: ["New description"] };
			validator.validate.eventChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'description' is not a string");
				done();
			});
		});


		it("Should succeed if input specifies one valid property", (done) => {
			const input = { title: "New title" };
			validator.validate.eventChangeInput(input, (error) => {
				should.not.exist(error);
				done();
			});
		});


		it("Should succeed if input specifies several valid properties", (done) => {
			const input = { title: "New title", description: "New description" };
			validator.validate.eventChangeInput(input, (error) => {
				should.not.exist(error);
				done();
			});
		});


	});



	describe("validate.eventTypeCreationInput", () => {


		it("Should fail if no input", (done) => {
			const input = undefined;
			validator.validate.eventTypeCreationInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("No input");
				done();
			});
		});


		it("Should fail when missing required fields", (done) => {
			const input = { name: "Cars" };
			validator.validate.eventTypeCreationInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("Does not specify exactly the required fields");
				done();
			});
		});


		it("Should fail when specifying unknown fields", (done) => {
			const input = { name: "Cars", color: "some-color", image: "some-image" };
			validator.validate.eventTypeCreationInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("Does not specify exactly the required fields");
				done();
			});
		});


		it("Should fail when name is not a string", (done) => {
			const input = { name: 500, color: "some-color" };
			validator.validate.eventTypeCreationInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'name' is not a string");
				done();
			});
		});


		it("Should fail when name is the empty string", (done) => {
			const input = { name: "", color: "some-color" };
			validator.validate.eventTypeCreationInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'name' can not be empty");
				done();
			});
		});


		it("Should fail when color is invalid", (done) => {
			state.validator.validate.color = (color, callback) => { return callback({ message: "No color" }) };
			const input = { name: "Cars", color: "some-color" };
			validator.validate.eventTypeCreationInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'color' was invalid");
				done();
			});
		});


		it("Should succeed when valid input", (done) => {
			const input = { name: "Cars", color: "some-color" };
			validator.validate.eventTypeCreationInput(input, (error) => {
				should.not.exist(error);
				done();
			});
		});
	});



	describe("validate.eventCreationInput", () => {


		it("Should fail if no input", (done) => {
			const input = undefined;
			validator.validate.eventCreationInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("No input");
				done();
			});
		});


		it("Should fail when missing required fields", (done) => {
			const input = { type: "type-id", description: "some-description", location: {}, startDate: 100, endDate: 200 };
			validator.validate.eventCreationInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("Does not specify exactly the required fields");
				done();
			});
		});

		it("Should fail when specifying unknown fields", (done) => {
			const input = { legend: "hero", type: "type-id", title: "some-title", description: "some-description", location: {}, startDate: 100, endDate: 200 };
			validator.validate.eventCreationInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("Does not specify exactly the required fields");
				done();
			});
		});


		it("Should fail if specified type is falsy", (done) => {
			const input = { type: "", title: "some-title", description: "some-description", location: {}, startDate: 100, endDate: 200 };
			validator.validate.eventCreationInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'type' does not have a value");
				done();
			});
		});


		it("Should fail if specified type does not exist", (done) => {
			const input = { type: "type-id", title: "some-title", description: "some-description", location: {}, startDate: 100, endDate: 200 };
			validator.validate.eventCreationInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("Event type does not exist");
				done();
			});
		});


		it("Should fail if specified title is empty", (done) => {
			state.database.collection("EventTypes").insert({ _id: "type-id" }, (error) => {
				should.not.exist(error);

				const input = { type: "type-id", title: "", description: "some-description", location: {}, startDate: 100, endDate: 200 };
				validator.validate.eventCreationInput(input, (error) => {
					should.exist(error);
					error.message.should.equal("'title' does not have a value");
					done();
				});
			});
		});


		it("Should fail if specified title is not a string", (done) => {
			state.database.collection("EventTypes").insert({ _id: "type-id" }, (error) => {
				should.not.exist(error);

				const input = { type: "type-id", title: ["some-title"], description: "some-description", location: {}, startDate: 100, endDate: 200 };
				validator.validate.eventCreationInput(input, (error) => {
					should.exist(error);
					error.message.should.equal("'title' is not a string");
					done();
				});
			});
		});


		it("Should fail if title is longer than 100 characters", (done) => {
			state.database.collection("EventTypes").insert({ _id: "type-id" }, (error) => {
				should.not.exist(error);

				const input = { type: "type-id", title: "This is a very long title of 101 characters. This is a very long title of 101 characters. This is ver", description: "some-description", location: {}, startDate: 100, endDate: 200 };
				validator.validate.eventCreationInput(input, (error) => {
					should.exist(error);
					error.message.should.equal("'title' is too long");
					done();
				});
			});
		});


		it("Should fail if specified description is empty", (done) => {
			state.database.collection("EventTypes").insert({ _id: "type-id" }, (error) => {
				should.not.exist(error);

				const input = { type: "type-id", title: "some-title", description: "", location: {}, startDate: 100, endDate: 200 };
				validator.validate.eventCreationInput(input, (error) => {
					should.exist(error);
					error.message.should.equal("'description' does not have a value");
					done();
				});
			});
		});


		it("Should fail if specified description is not a string", (done) => {
			state.database.collection("EventTypes").insert({ _id: "type-id" }, (error) => {
				should.not.exist(error);

				const input = { type: "type-id", title: "some-title", description: ["some-description"], location: {}, startDate: 100, endDate: 200 };
				validator.validate.eventCreationInput(input, (error) => {
					should.exist(error);
					error.message.should.equal("'description' is not a string");
					done();
				});
			});
		});


		it("Should fail if specified description is longer than 1.000 characters", (done) => {
			state.database.collection("EventTypes").insert({ _id: "type-id" }, (error) => {
				should.not.exist(error);

				const input = { type: "type-id", title: "some-title", description: "This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 characters. This is a very long description of 1.001 charac", location: {}, startDate: 100, endDate: 200 };
				validator.validate.eventCreationInput(input, (error) => {
					should.exist(error);
					error.message.should.equal("'description' is too long");
					done();
				});
			});
		});


		it("Should fail if specified location is falsy", (done) => {
			state.database.collection("EventTypes").insert({ _id: "type-id" }, (error) => {
				should.not.exist(error);

				const input = { type: "type-id", title: "some-title", description: "some-description", location: undefined, startDate: 100, endDate: 200 };
				validator.validate.eventCreationInput(input, (error) => {
					should.exist(error);
					error.message.should.equal("'location' does not have a value");
					done();
				});
			});
		});


		it("Should fail if location does not specify required fields", (done) => {
			state.database.collection("EventTypes").insert({ _id: "type-id" }, (error) => {
				should.not.exist(error);

				const input = { type: "type-id", title: "some-title", description: "some-description", location: {}, startDate: 100, endDate: 200 };
				validator.validate.eventCreationInput(input, (error) => {
					should.exist(error);
					error.message.should.equal("'location' does not have required fields");
					done();
				});
			});
		});


		it("Should fail if specified location's address is not a string", (done) => {
			state.database.collection("EventTypes").insert({ _id: "type-id" }, (error) => {
				should.not.exist(error);

				const input = { type: "type-id", title: "some-title", description: "some-description", location: { address: 508, coordinates: { latitude: -85, longitude: 100 } }, startDate: 100, endDate: 200 };
				validator.validate.eventCreationInput(input, (error) => {
					should.exist(error);
					error.message.should.equal("'location.address' is not a string");
					done();
				});
			});
		});


		it("Should fail if specified location's address is longer than 200 characters", (done) => {
			state.database.collection("EventTypes").insert({ _id: "type-id" }, (error) => {
				should.not.exist(error);

				const input = { type: "type-id", title: "some-title", description: "some-description", location: { address: "This is a very long address longer than 200 characters. This is a very long address longer than 200 characters. This is a very long address longer than 200 characters. This is a very long address longe", coordinates: { latitude: -85, longitude: 100 } }, startDate: 100, endDate: 200 };
				validator.validate.eventCreationInput(input, (error) => {
					should.exist(error);
					error.message.should.equal("'location.address' is too long");
					done();
				});
			});
		});


		it("Should fail if specified location's coordinates are missing", (done) => {
			state.database.collection("EventTypes").insert({ _id: "type-id" }, (error) => {
				should.not.exist(error);

				const input = { type: "type-id", title: "some-title", description: "some-description", location: { address: "some-address", coordinates: undefined }, startDate: 100, endDate: 200 };
				validator.validate.eventCreationInput(input, (error) => {
					should.exist(error);
					error.message.should.equal("'location.coordinates' does not have a value");
					done();
				});
			});
		});


		it("Should fail if specified location's latitude is not a number", (done) => {
			state.database.collection("EventTypes").insert({ _id: "type-id" }, (error) => {
				should.not.exist(error);

				const input = { type: "type-id", title: "some-title", description: "some-description", location: { address: "some-address", coordinates: { latitude: "-85", longitude: 100 } }, startDate: 100, endDate: 200 };
				validator.validate.eventCreationInput(input, (error) => {
					should.exist(error);
					error.message.should.equal("'location.coordinates.latitude' is not a number");
					done();
				});
			});
		});


		it("Should fail if specified location's latitude is invalid", (done) => {
			state.database.collection("EventTypes").insert({ _id: "type-id" }, (error) => {
				should.not.exist(error);

				const input = { type: "type-id", title: "some-title", description: "some-description", location: { address: "some-address", coordinates: { latitude: -100, longitude: 100 } }, startDate: 100, endDate: 200 };
				validator.validate.eventCreationInput(input, (error) => {
					should.exist(error);
					error.message.should.equal("'location.coordinates.latitude' is invalid");
					done();
				});
			});
		});


		it("Should fail if specified location's longitude is not a number", (done) => {
			state.database.collection("EventTypes").insert({ _id: "type-id" }, (error) => {
				should.not.exist(error);

				const input = { type: "type-id", title: "some-title", description: "some-description", location: { address: "some-address", coordinates: { latitude: -85, longitude: "100" } }, startDate: 100, endDate: 200 };
				validator.validate.eventCreationInput(input, (error) => {
					should.exist(error);
					error.message.should.equal("'location.coordinates.longitude' is not a number");
					done();
				});
			});
		});


		it("Should fail if specified location's longitude is invalid", (done) => {
			state.database.collection("EventTypes").insert({ _id: "type-id" }, (error) => {
				should.not.exist(error);

				const input = { type: "type-id", title: "some-title", description: "some-description", location: { address: "some-address", coordinates: { latitude: -85, longitude: 190 } }, startDate: 100, endDate: 200 };
				validator.validate.eventCreationInput(input, (error) => {
					should.exist(error);
					error.message.should.equal("'location.coordinates.longitude' is invalid");
					done();
				});
			});
		});
		

		it("Should fail if specified start date is not a number", (done) => {
			state.database.collection("EventTypes").insert({ _id: "type-id" }, (error) => {
				should.not.exist(error);

				const input = { type: "type-id", title: "some-title", description: "some-description", location: { address: "some-address", coordinates: { latitude: -85, longitude: 100 } }, startDate: "100", endDate: 200 };
				validator.validate.eventCreationInput(input, (error) => {
					should.exist(error);
					error.message.should.equal("'startDate' is not a number");
					done();
				});
			});
		});


		it("Should fail if specified end date is not a number", (done) => {
			state.database.collection("EventTypes").insert({ _id: "type-id" }, (error) => {
				should.not.exist(error);

				const input = { type: "type-id", title: "some-title", description: "some-description", location: { address: "some-address", coordinates: { latitude: -85, longitude: 100 } }, startDate: 100, endDate: "200" };
				validator.validate.eventCreationInput(input, (error) => {
					should.exist(error);
					error.message.should.equal("'endDate' is not a number");
					done();
				});
			});
		});


		it("Should fail if specified start date is after end date", (done) => {
			state.database.collection("EventTypes").insert({ _id: "type-id" }, (error) => {
				should.not.exist(error);

				const input = { type: "type-id", title: "some-title", description: "some-description", location: { address: "some-address", coordinates: { latitude: -85, longitude: 100 } }, startDate: 300, endDate: 200 };
				validator.validate.eventCreationInput(input, (error) => {
					should.exist(error);
					error.message.should.equal("'startDate' is later than 'endDate'");
					done();
				});
			});
		});


		it("Should succeed if input is valid", (done) => {
			state.database.collection("EventTypes").insert({ _id: "type-id" }, (error) => {
				should.not.exist(error);

				const input = { type: "type-id", title: "some-title", description: "some-description", location: { address: "some-address", coordinates: { latitude: -85, longitude: 100 } }, startDate: 100, endDate: 200 };
				validator.validate.eventCreationInput(input, (error) => {
					should.not.exist(error);
					done();
				});
			});
		});


	});



	describe("validate.eventTypeChangeInput", () => {
		

		it("Should fail if id is not a string", (done) => {
			const eventTypeId = undefined;
			const input = { name: "Cars", color: "some-red-color" };
			validator.validate.eventTypeChangeInput(eventTypeId, input, (error) => {
				should.exist(error);
				error.message.should.equal("Event type id was not a string");
				done();
			});
		});


		it("Should fail if id is the empty string", (done) => {
			const eventTypeId = "";
			const input = { name: "Cars", color: "some-red-color" };
			validator.validate.eventTypeChangeInput(eventTypeId, input, (error) => {
				should.exist(error);
				error.message.should.equal("Event type id was the empty string");
				done();
			});
		});


		it("Should fail if no input", (done) => {
			const eventTypeId = "event-type-id";
			const input = undefined;
			validator.validate.eventTypeChangeInput(eventTypeId, input, (error) => {
				should.exist(error);
				error.message.should.equal("No input");
				done();
			});
		});


		it("Should fail if no fields specified", (done) => {
			const eventTypeId = "event-type-id";
			const input = {};
			validator.validate.eventTypeChangeInput(eventTypeId, input, (error) => {
				should.exist(error);
				error.message.should.equal("No fields specified");
				done();
			});
		});


		it("Should fail if specifying unknown fields", (done) => {
			const eventTypeId = "event-type-id";
			const input = { unknown: "Cars" };
			validator.validate.eventTypeChangeInput(eventTypeId, input, (error) => {
				should.exist(error);
				error.message.should.equal("Unknown fields specified");
				done();
			});
		});


		it("Should fail if name is not a string", (done) => {
			const eventTypeId = "event-type-id";
			const input = { name: 500 };
			validator.validate.eventTypeChangeInput(eventTypeId, input, (error) => {
				should.exist(error);
				error.message.should.equal("'name' was not a string");
				done();
			});
		});


		it("Should fail if name is the empty string", (done) => {
			const eventTypeId = "event-type-id";
			const input = { name: "" };
			validator.validate.eventTypeChangeInput(eventTypeId, input, (error) => {
				should.exist(error);
				error.message.should.equal("'name' was the empty string");
				done();
			});
		});


		it("Should fail if name is too long", (done) => {
			const eventTypeId = "event-type-id";
			const input = { name: "This is a long name of 51 characters. This is a lon" };
			validator.validate.eventTypeChangeInput(eventTypeId, input, (error) => {
				should.exist(error);
				error.message.should.equal("'name' was too long");
				done();
			});
		});


		it("Should fail if color is invalid", (done) => {
			state.validator.validate.color = (color, callback) => { return callback({ message: "No color" }) };
			const eventTypeId = "event-type-id";
			const input = { color: "some-red-color" };
			validator.validate.eventTypeChangeInput(eventTypeId, input, (error) => {
				should.exist(error);
				error.message.should.equal("'color' was invalid");
				done();
			});
		});


		it("Should fail if both valid and invalid fields", (done) => {
			state.validator.validate.color = (color, callback) => { return callback({ message: "No color" }) };
			const eventTypeId = "event-type-id";
			const input = { name: "Cars", color: "some-red-color" };
			validator.validate.eventTypeChangeInput(eventTypeId, input, (error) => {
				should.exist(error);
				error.message.should.equal("'color' was invalid");
				done();
			});
		});
		

		it("Should succeed if name is valid", (done) => {
			const eventTypeId = "event-type-id";
			const input = { name: "Cars" };
			validator.validate.eventTypeChangeInput(eventTypeId, input, (error) => {
				should.not.exist(error);
				done();
			});
		});


		it("Should succeed if color is valid", (done) => {
			const eventTypeId = "event-type-id";
			const input = { color: "some-red-color" };
			validator.validate.eventTypeChangeInput(eventTypeId, input, (error) => {
				should.not.exist(error);
				done();
			});
		});


		it("Should succeed if several valid fields", (done) => {
			const eventTypeId = "event-type-id";
			const input = { name: "Cars", color: "some-red-color" };
			validator.validate.eventTypeChangeInput(eventTypeId, input, (error) => {
				should.not.exist(error);
				done();
			});
		});


	});



	describe("validate.settingsChangeInput", () => {
		

		it("Should fail if no input", (done) => {
			const input = undefined;
			validator.validate.settingsChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("No input");
				done();
			});
		});


		it("Should fail if payment mode is not a string", (done) => {
			const input = { paymentMode: 368 };
			validator.validate.settingsChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'paymentMode' was not a string");
				done();
			});
		});


		it("Should fail if unrecognised payment mode", (done) => {
			const input = { paymentMode: "money" };
			validator.validate.settingsChangeInput(input, (error) => {
				should.exist(error);
				error.message.should.equal("'paymentMode' was not recognised");
				done();
			});
		});


		it("Should succeed if valid input", (done) => {
			const input = { paymentMode: "Free" };
			validator.validate.settingsChangeInput(input, (error) => {
				should.not.exist(error);
				done();
			});
		});

		
	});



});