const should = require("chai").should();
const agent = require("superagent");
const TestState = require("../source/TestState");

const state = {};
const app = require("../source/Server")(state);
var server = undefined;

describe("LoginRouter", () => {


	before((done) => {
		server = app.listen(4000, done);
	})

	beforeEach(() => {
		TestState.infuse(state);
	});

	after((done) => {
		server.close();
		done();
	});


	describe("POST /login", () => {


		it("Should fail if invalid input", (done) => {
			state.validator.validate.facebookLogin = (input, requiredPermissions, callback) => { callback(false) };
			const login = { facebookUserId: "john1234", token: "1234" };
			agent
				.post("localhost:4000/login")
				.send(login)
				.end((error, response) => {
					response.status.should.equal(400);
					response.text.should.equal("Input was invalid");
					done();
				});
		});


		it("Should fail if user does not exist", (done) => {
			const login = { facebookUserId: "john1234", token: "1234" };
			agent
				.post("localhost:4000/login")
				.send(login)
				.end((error, response) => {
					response.status.should.equal(400);
					response.text.should.equal("User does not exist");
					done();
				});
		});


		it("Should return 200 when succesful", (done) => {
			const login = { facebookUserId: "john1234", token: "1234" };
			state.database.collection("EnabledUsers").insert({ _id: "user-id", facebookUserId: "john1234" }, () => {
				agent
					.post("localhost:4000/login")
					.send(login)
					.end((error, response) => {
						response.status.should.equal(200);
						done();
					});
			});
		});


		it("Should delete old credential if one is present", (done) => {
			const login = { facebookUserId: "john1234", token: "1234" };
			state.database.collection("EnabledUsers").insert({ _id: "user-id", facebookUserId: "john1234" }, (error) => {
				should.not.exist(error);

				state.database.collection("Credentials").insert({ _id: "old-credential-id", userId: "user-id" }, () => {
					agent
						.post("localhost:4000/login")
						.send(login)
						.end((error, response) => {
							state.database.collection("Credentials").findOne({ _id: "old-credential-id" }, (error, credential) => {
								should.not.exist(error);
								should.not.exist(credential);
								done();
							});
						});
				});
			});
		});


		it("Should create and store credential in Credentials when succesful", (done) => {
			state.factory.createId = () => { return "credential-id" };
			state.calendar.hoursFromNow = () => { return new Date(1000) };

			const login = { facebookUserId: "john1234", token: "1234" };
			state.database.collection("EnabledUsers").insert({ _id: "user-id", facebookUserId: "john1234" }, (error) => {
				should.not.exist(error);
				
				agent
					.post("localhost:4000/login")
					.send(login)
					.end((error, response) => {
						state.database.collection("Credentials").findOne({ userId: "user-id" }, (error, credential) => {
							should.not.exist(error);
							should.exist(credential);

							const expectedCredential = { _id: "credential-id", userId: "user-id", role: "User", expires: 1000 };
							credential.should.deep.equal(expectedCredential);
							done();
						});
					});
			});
		});


		it("Should return stripped credential when succesful", (done) => {
			state.factory.createId = () => { return "credential-id" };

			const login = { facebookUserId: "john1234", token: "1234" };
			state.database.collection("EnabledUsers").insert({ _id: "user-id", facebookUserId: "john1234" }, (error) => {
				should.not.exist(error);

				agent
					.post("localhost:4000/login")
					.send(login)
					.end((error, response) => {
						const expectedCredential = { token: "credential-id" };
						response.body.should.deep.equal(expectedCredential);
						done();
					});
			});
		});


	});



	describe("POST /login/admin", () => {
        

        it("Should fail if invalid login", (done) => {
        	state.validator.validate.adminLogin = (login, callback) => { return callback(false) };

            const login = { username: "admin", password: "password" };
            agent
                .post("localhost:4000/login/admin")
                .send(login)
                .end((error, response) => {
                    response.status.should.equal(401);
                    response.text.should.equal("Invalid admin login");
                    done();
                });
        });


        it("Should return 200 if valid login", (done) => {
        	const login = { username: "admin", password: "password" };
            agent
                .post("localhost:4000/login/admin")
                .send(login)
                .end((error, response) => {
                    response.status.should.equal(200);
                    done();
                });
        });


        it("Should return credential if valid login", (done) => {
        	const login = { username: "admin", password: "password" };
            agent
                .post("localhost:4000/login/admin")
                .send(login)
                .end((error, response) => {
                    response.status.should.equal(200);
                    response.body.should.deep.equal(login);
                    done();
                });
        });


    });



    describe("GET /login/user", () => {


    	it("Should fail if not logged in as user", (done) => {
    		state.validator.validate.userCredentialHeader = (header, callback) => { return callback(false) };
    		agent
				.get("localhost:4000/login/user")
				.end((error, response) => {
					response.status.should.equal(401);
					response.text.should.equal("Credential was invalid");
					done();
				});
    	});


    	it("Should return user when succesful", (done) => {
			state.validator.validate.userCredentialHeader = (header, callback) => { return callback(true, { userId: "user-id" }) };
			state.database.collection("EnabledUsers").insert({ _id: "user-id", facebookUserId: "john1234" }, (error) => {
				should.not.exist(error);

				agent
					.get("localhost:4000/login/user")
					.end((error, response) => {
						const expectedUser = { _id: "user-id", facebookUserId: "john1234" };
						response.body.should.deep.equal(expectedUser);
						done();
					});
			});
		});


    });



});