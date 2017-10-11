const should = require("chai").should();
const agent = require("superagent");

const TestState = require("../source/TestState");

const state = {};
const app = require("../source/Server")(state);
var server = undefined;

describe("EventTypeRouter", () => {

    before((done) => {
        server = app.listen(4000, done);
    });

    beforeEach(() => {
        TestState.infuse(state);
    });

    after((done) => {
        server.close(done);
    });

    

    describe("GET /settings", () => {
        

        it("Should fail if not logged in as user", (done) => {
            state.validator.validate.userCredentialHeader = (header, callback) => { return callback(false) };
            agent
                .get("localhost:4000/settings")
                .end((error, response) => {
                    response.status.should.equal(401);
                    response.text.should.equal("Credential was invalid");
                    done();
                });
        });


        it("Should fail if no settings", (done) => {
            agent
                .get("localhost:4000/settings")
                .end((error, response) => {
                    response.status.should.equal(500);
                    response.text.should.equal("Settings are corrupt");
                    done();
                });
        });


        it("Should fail if several settings", (done) => {
            state.database.collection("Settings").insert([{ _id: "1", }, { _id: "2" }], (error) => {
                should.not.exist(error);

                agent
                    .get("localhost:4000/settings")
                    .end((error, response) => {
                        response.status.should.equal(500);
                        response.text.should.equal("Settings are corrupt");
                        done();
                    });
            });
        });


        it("Should load settings", (done) => {
            state.database.collection("Settings").insert([{ _id: "1", }], (error) => {
                should.not.exist(error);

                agent
                    .get("localhost:4000/settings")
                    .end((error, response) => {
                        response.status.should.equal(200);

                        const expectedSettings = { _id: "1" };
                        response.body.should.deep.equal(expectedSettings);
                        done();
                    });
            });
        });
    });



    describe("GET /settings/admin", () => {
        

        it("Should fail if not logged in as admin", (done) => {
            state.validator.validate.adminLoginHeader = (header, callback) => { return callback(false) };
            agent
                .get("localhost:4000/settings/admin")
                .end((error, response) => {
                    response.status.should.equal(401);
                    response.text.should.equal("Invalid admin login");
                    done();
                });
        });


        it("Should fail if no settings", (done) => {
            agent
                .get("localhost:4000/settings/admin")
                .end((error, response) => {
                    response.status.should.equal(500);
                    response.text.should.equal("Settings are corrupt");
                    done();
                });
        });


        it("Should fail if several settings", (done) => {
            state.database.collection("Settings").insert([{ _id: "1", }, { _id: "2" }], (error) => {
                should.not.exist(error);

                agent
                    .get("localhost:4000/settings/admin")
                    .end((error, response) => {
                        response.status.should.equal(500);
                        response.text.should.equal("Settings are corrupt");
                        done();
                    });
            });
        });


        it("Should load settings", (done) => {
            state.database.collection("Settings").insert([{ _id: "1", }], (error) => {
                should.not.exist(error);

                agent
                    .get("localhost:4000/settings/admin")
                    .end((error, response) => {
                        response.status.should.equal(200);

                        const expectedSettings = { _id: "1" };
                        response.body.should.deep.equal(expectedSettings);
                        done();
                    });
            });
        });


    });



    describe("PUT /settings", () => {


        it("Should fail if not logged in as admin", (done) => {
            state.validator.validate.adminLoginHeader = (header, callback) => { return callback(false) };
            agent
                .put("localhost:4000/settings")
                .end((error, response) => {
                    response.status.should.equal(401);
                    response.text.should.equal("Invalid admin login");
                    done();
                });
        });


        it("Should fail if input is invalid", (done) => {
            state.validator.validate.settingsChangeInput = (input, callback) => { return callback({ message: "Invalid input" }) };
            agent
                .put("localhost:4000/settings")
                .end((error, response) => {
                    response.status.should.equal(400);
                    response.text.should.equal("Invalid input");
                    done();
                });
        });


        it("Should return 200 if succesful", (done) => {
            agent
                .put("localhost:4000/settings")
                .end((error, response) => {
                    response.status.should.equal(200);
                    response.text.should.equal("Succesfully updated settings");
                    done();
                });
        });


        it("Should update settings", (done) => {
            state.database.collection("Settings").insert({ _id: "settings-id", paymentMode: "Free" }, (error) => {
                should.not.exist(error);

                const input = { paymentMode: "Costs" };
                agent
                    .put("localhost:4000/settings")
                    .send(input)
                    .end((error, response) => {
                        state.database.collection("Settings").findOne({ _id: "settings-id" }, (error, settings) => {
                            should.not.exist(error);
                            should.exist(settings);

                            const expectedSettings = { _id: "settings-id", paymentMode: "Costs" };
                            settings.should.deep.equal(expectedSettings);

                            done();
                        });
                    });
            });
        });


    });



});
