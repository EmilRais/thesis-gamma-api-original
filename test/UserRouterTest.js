const should = require("chai").should();
const agent = require("superagent");

const TestState = require("../source/TestState");
const FacebookApp = require("../source/Configuration").facebook;

const state = {};
const app = require("../source/Server")(state);
var server = undefined;

describe("UserRouter", () => {

    before((done) => {
        server = app.listen(4000, done);
    });

    beforeEach(() => {
        TestState.infuse(state);
    });

    after((done) => {
        server.close(done);
    });



    describe("POST /users/enabled/exists", () => {


        it("Should return 200 if user exists", (done) => {
            const user = { _id: 1, facebookUserId: "user-id" };
            state.database.collection("EnabledUsers").insert(user, function (error, result) {
                should.not.exist(error);

                const login = { facebookUserId: "user-id", token: "token" };
                agent
                    .post("localhost:4000/users/enabled/exists/")
                    .send(login)
                    .end((error, response) => {
                        response.status.should.equal(200);
                        response.text.should.equal("The user exists");
                        done();
                });
            });
        });


        it("Should return 204 if user does not exists", (done) => {
            const login = { facebookUserId: "user-id", token: "token" };
            agent
                .post("localhost:4000/users/enabled/exists/")
                .send(login)
                .end((error, response) => {
                    response.status.should.equal(204);
                    done();
            });
        });


        it("Should deny invalid login", (done) => {
            state.validator.validate.facebookLogin = (login, requiredPermissions, callback) => { callback(false) };
            const login = { facebookUserId: "user-id", token: "token" };
            agent
                .post("localhost:4000/users/enabled/exists/")
                .send(login)
                .end((error, response) => {
                    response.status.should.equal(400);
                    response.text.should.equal("Login was not valid");
                    done();
            });
        });


    });



    describe("POST /users/enabled", () => {


        it("Should reject invalid credential", (done) => {
            state.validator.validate.facebookLogin = (login, requiredPermissions, callback) => { callback(false) };
            const login = { facebookUserId: "user-id", token: "token" };
            agent
                .post("localhost:4000/users/enabled")
                .send(login)
                .end((error, response) => {
                    response.status.should.equal(400);
                    response.text.should.equal("Login was not valid");
                    done();
            });
        });


        it("Should return error if user already exists", (done) => {
            const user = { _id: 1, facebookUserId: "user-id" };
            state.database.collection("EnabledUsers").insert(user, function (error, result) {

                const login = { facebookUserId: "user-id", token: "token" };
                agent
                    .post("localhost:4000/users/enabled")
                    .send(login)
                    .end((error, response) => {
                        response.status.should.equal(401);
                        response.text.should.equal("User already exists");
                        done();
                    });
            });
        });


        it("Should return 201 on success", (done) => {
            const login = { facebookUserId: "user-id", token: "token" };
            agent
                .post("localhost:4000/users/enabled")
                .send(login)
                .end((error, response) => {
                    response.status.should.equal(201);
                    response.text.should.equal("Created the user");
                    done();
                });
        });


        it("Should create and store user", (done) => {
            state.factory.createId = () => { return "user-id" };
            const login = { facebookUserId: "facebook-user-id", token: "token" };
            agent
                .post("localhost:4000/users/enabled")
                .send(login)
                .end((error, response) => {
                    state.database.collection("EnabledUsers").findOne({ facebookUserId: "facebook-user-id" }, (error, user) => {
                        should.not.exist(error);
                        should.exist(user);
                        user.should.deep.equal({ _id: "user-id", facebookUserId: "facebook-user-id", events: [] });
                        done();
                    });
                });
        });


    });



    describe("POST /users/:userId/disable", () => {
        

        it("Should fail if not logged in as admin", (done) => {
            state.validator.validate.adminLoginHeader = (header, callback) => { return callback(false) };
            const userId = "unknown-user";
            agent
                .post(`localhost:4000/users/${userId}/disable`)
                .end((error, response) => {
                    response.status.should.equal(401);
                    response.text.should.equal("Invalid admin login");
                    done();
                });
        });


        it("Should fail if user is unrecognised", (done) => {
            const userId = "unknown-user";
            agent
                .post(`localhost:4000/users/${userId}/disable`)
                .end((error, response) => {
                    response.status.should.equal(400);
                    response.text.should.equal("The user could not be found");
                    done();
                });
        });


        it("Should fail if user is already disabled", (done) => {
            state.database.collection("DisabledUsers").insert({ _id: "some-user" }, (error) => {
                should.not.exist(error);

                const userId = "some-user";
                agent
                    .post(`localhost:4000/users/${userId}/disable`)
                    .end((error, response) => {
                        response.status.should.equal(400);
                        response.text.should.equal("The user was already disabled");
                        done();
                    });
            });
        });


        it("Should return 200 when succesful", (done) => {
            state.database.collection("EnabledUsers").insert({ _id: "some-user" }, (error) => {
                should.not.exist(error);

                const userId = "some-user";
                agent
                    .post(`localhost:4000/users/${userId}/disable`)
                    .end((error, response) => {
                        response.status.should.equal(200);
                        response.text.should.equal("Succesfully disabled the user");
                        done();
                    });
            });
        });


        it("Should disable an enabled user", (done) => {
            state.database.collection("EnabledUsers").insert({ _id: "some-user" }, (error) => {
                should.not.exist(error);

                const userId = "some-user";
                agent
                    .post(`localhost:4000/users/${userId}/disable`)
                    .end((error, response) => {
                        state.database.collection("EnabledUsers").findOne({ _id: "some-user" }, (enabledError, enabledUser) => {
                            state.database.collection("DisabledUsers").findOne({ _id: "some-user" }, (disabledError, disabledUser) => {
                                should.not.exist(enabledError);
                                should.not.exist(disabledError);
                                should.not.exist(enabledUser);
                                should.exist(disabledUser);

                                disabledUser._id.should.equal("some-user");
                                done();
                            });
                        });
                    });
            });
        });


    });



    describe("POST /users/:userId/enable", () => {


        it("Should fail if not logged in as admin", (done) => {
            state.validator.validate.adminLoginHeader = (header, callback) => { return callback(false) };
            const userId = "unknown-user";
            agent
                .post(`localhost:4000/users/${userId}/enable`)
                .end((error, response) => {
                    response.status.should.equal(401);
                    response.text.should.equal("Invalid admin login");
                    done();
                });
        });


        it("Should fail if user is unrecognised", (done) => {
            const userId = "unknown-user";
            agent
                .post(`localhost:4000/users/${userId}/enable`)
                .end((error, response) => {
                    response.status.should.equal(400);
                    response.text.should.equal("The user could not be found");
                    done();
                });
        });


        it("Should fail if user is already enabled", (done) => {
            state.database.collection("EnabledUsers").insert({ _id: "some-user" }, (error) => {
                should.not.exist(error);

                const userId = "some-user";
                agent
                    .post(`localhost:4000/users/${userId}/enable`)
                    .end((error, response) => {
                        response.status.should.equal(400);
                        response.text.should.equal("The user was already enabled");
                        done();
                    });
            });
        });


        it("Should return 200 when succesful", (done) => {
            state.database.collection("DisabledUsers").insert({ _id: "some-user" }, (error) => {
                should.not.exist(error);

                const userId = "some-user";
                agent
                    .post(`localhost:4000/users/${userId}/enable`)
                    .end((error, response) => {
                        response.status.should.equal(200);
                        response.text.should.equal("Succesfully enabled the user");
                        done();
                    });
            });
        });


        it("Should enable a disabled user", (done) => {
            state.database.collection("DisabledUsers").insert({ _id: "some-user" }, (error) => {
                should.not.exist(error);

                const userId = "some-user";
                agent
                    .post(`localhost:4000/users/${userId}/enable`)
                    .end((error, response) => {
                        state.database.collection("EnabledUsers").findOne({ _id: "some-user" }, (enabledError, enabledUser) => {
                            state.database.collection("DisabledUsers").findOne({ _id: "some-user" }, (disabledError, disabledUser) => {
                                should.not.exist(enabledError);
                                should.not.exist(disabledError);
                                should.not.exist(disabledUser);
                                should.exist(enabledUser);
                                
                                enabledUser._id.should.equal("some-user");
                                done();
                            });
                        });
                    });
            });
        });
    });



    describe("GET /users/:state", () => {


        it("Should fail if not logged in as admin", (done) => {
            state.validator.validate.adminLoginHeader = (header, callback) => { return callback(false) };
            const userState = "unknown";
            agent
                .get(`localhost:4000/users/${userState}`)
                .end((error, response) => {
                    response.status.should.equal(401);
                    response.text.should.equal("Invalid admin login");
                    done();
                });
        });


        it("Should fail loading users of an unrecognised type", (done) => {
            const userState = "unknown";
            agent
                .get(`localhost:4000/users/${userState}`)
                .end((error, response) => {
                    response.status.should.equal(400);
                    response.text.should.equal("Unrecognised user state");
                    done();
                });
        });


        it("Should be able to retrieve no users", (done) => {
            const userState = "enabled";
            agent
                .get(`localhost:4000/users/${userState}`)
                .end((error, response) => {
                    response.body.should.be.empty;
                    done();
                });
        });


        it("Should be able to retrieve several users", (done) => {
            const users = [ { _id: "monkey" }, { _id: "donkey" } ];
            state.database.collection("EnabledUsers").insert(users, (error) => {
                should.not.exist(error);

                const userState = "enabled";
                agent
                    .get(`localhost:4000/users/${userState}`)
                    .end((error, response) => {
                        should.not.exist(error);
                        response.body.should.deep.equal(users);
                        done();
                    });
            });
        });


        it("Should return 200 when succesful", (done) => {
            const userState = "enabled";
            agent
                .get(`localhost:4000/users/${userState}`)
                .end((error, response) => {
                    response.status.should.equal(200);
                    done();
                });
        });


        it("Should be able to retrieve enabled users", (done) => {
            const userState = "enabled";
            agent
                .get(`localhost:4000/users/${userState}`)
                .end((error, response) => {
                    response.status.should.equal(200);
                    done();
                });
        });


        it("Should be able to retrieve disabled users", (done) => {
            const userState = "disabled";
            agent
                .get(`localhost:4000/users/${userState}`)
                .end((error, response) => {
                    response.status.should.equal(200);
                    done();
                });
        });


    });



    describe("DELETE /users/:userId", () => {
        

        it("Should fail if not logged in as admin", (done) => {
            state.validator.validate.adminLoginHeader = (header, callback) => { return callback(false) };
            const userId = "user-id";
            agent
                .del(`localhost:4000/users/${userId}`)
                .end((error, response) => {
                    response.status.should.equal(401);
                    response.text.should.equal("Invalid admin login");
                    done();
                });
        });


        it("Should return 200 when succesful", (done) => {
            state.database.collection("EnabledUsers").insert({ _id: "user-id" }, (error) => {
                should.not.exist(error);

                const userId = "user-id";
                agent
                    .del(`localhost:4000/users/${userId}`)
                    .end((error, response) => {
                        response.status.should.equal(200);
                        response.text.should.equal("Deleted the user");
                        done();
                    });
            });
        });


        it("Should delete an enabled user", (done) => {
            state.database.collection("EnabledUsers").insert({ _id: "user-id" }, (error) => {
                should.not.exist(error);

                const userId = "user-id";
                agent
                    .del(`localhost:4000/users/${userId}`)
                    .end((error, response) => {
                        state.database.collection("EnabledUsers").findOne({ _id: "user-id" }, (error, user) => {
                            should.not.exist(error);
                            should.not.exist(user);
                            done();
                        });
                    });
            });
        });


        it("Should delete a disabled user", (done) => {
            state.database.collection("DisabledUsers").insert({ _id: "user-id" }, (error) => {
                should.not.exist(error);

                const userId = "user-id";
                agent
                    .del(`localhost:4000/users/${userId}`)
                    .end((error, response) => {
                        state.database.collection("DisabledUsers").findOne({ _id: "user-id" }, (error, user) => {
                            should.not.exist(error);
                            should.not.exist(user);
                            done();
                        });
                    });
            });
        });


    });



});
