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

    

    describe("GET /event-types", () => {


        it("Should be able to load 0 event types", (done) => {
            agent
                .get("localhost:4000/event-types")
                .end((error, response) => {
                    response.status.should.be.equal(200);
                    response.body.should.be.empty;
                    done();
                });
        });


        it("Should be able to load several event types", (done) => {
            state.database.collection("EventTypes").insert([{ name: "Cars" }, { name: "Buildings" }], () => {
                agent
                    .get("localhost:4000/event-types")
                    .end((error, response) => {
                        response.status.should.be.equal(200);
                        response.body.should.have.length(2);
                        done();
                });
            });
        });


    });



    describe("POST /event-types", () => {


        it("Should fail if not logged in as admin", (done) => {
            state.validator.validate.adminLoginHeader = (header, callback) => { return callback(false) };
            agent
                .post("localhost:4000/event-types")
                .end((error, response) => {
                    response.status.should.equal(401);
                    response.text.should.equal("Invalid admin login");
                    done();
                });
        });


        it("Should fail if input is invalid", (done) => {
            state.validator.validate.eventTypeCreationInput = (input, callback) => { return callback({ message: "The input was invalid" }) };
            agent
                .post("localhost:4000/event-types")
                .end((error, response) => {
                    response.status.should.equal(400);
                    response.text.should.equal("The input was invalid");
                    done();
                });
        });


        it("Should return 201 when succesful", (done) => {
            const eventType = { name: "Cars" };
            agent
                .post("localhost:4000/event-types")
                .send(eventType)
                .end((error, response) => {
                    response.status.should.equal(201);
                    response.text.should.equal("Created the event type");
                    done();
                });
        });


        it("Should create and store valid event type", (done) => {
            state.factory.createId = () => { return "type-id" };
            const eventType = { name: "Cars" };
            agent
                .post("localhost:4000/event-types")
                .send(eventType)
                .end((error, response) => {
                    state.database.collection("EventTypes").findOne({ _id: "type-id" }, (error, storedEventType) => {
                        should.not.exist(error);
                        should.exist(storedEventType);
                        
                        const expectedEventType = { _id: "type-id", name: "Cars", color: undefined };
                        storedEventType.should.deep.equal(expectedEventType);

                        done();
                    });
                });
        });


    });



    describe("DELETE /event-types/:eventTypeId", () => {


        it("Should fail if not logged in as admin", (done) => {
            state.validator.validate.adminLoginHeader = (header, callback) => { return callback(false) };
            const eventTypeId = "event-type-id";
            agent
                .del(`localhost:4000/event-types/${eventTypeId}`)
                .end((error, response) => {
                    response.status.should.equal(401);
                    response.text.should.equal("Invalid admin login");
                    done();
                });
        });


        it("Should fail if event type is in use by approved event", (done) => {
            state.database.collection("ApprovedEvents").insert({ type: "event-type-id", title: "Camping" }, (error) => {
                should.not.exist(error);

                const eventTypeId = "event-type-id";
                agent
                    .del(`localhost:4000/event-types/${eventTypeId}`)
                    .end((error, response) => {
                        response.status.should.equal(400);
                        response.text.should.equal('Event type is used by "Camping"');
                        done();
                    });
            });
        });


        it("Should fail if event type is in use by pending event", (done) => {
            state.database.collection("PendingEvents").insert({ type: "event-type-id", title: "Camping" }, (error) => {
                should.not.exist(error);

                const eventTypeId = "event-type-id";
                agent
                    .del(`localhost:4000/event-types/${eventTypeId}`)
                    .end((error, response) => {
                        response.status.should.equal(400);
                        response.text.should.equal('Event type is used by "Camping"');
                        done();
                    });
            });
        });


        it("Should fail if event type is in use by rejected event", (done) => {
            state.database.collection("RejectedEvents").insert({ type: "event-type-id", title: "Camping" }, (error) => {
                should.not.exist(error);

                const eventTypeId = "event-type-id";
                agent
                    .del(`localhost:4000/event-types/${eventTypeId}`)
                    .end((error, response) => {
                        response.status.should.equal(400);
                        response.text.should.equal('Event type is used by "Camping"');
                        done();
                    });
            });
        });


        it("Should return 200 when succesful", (done) => {
            state.database.collection("EventTypes").insert({ _id: "event-type-id" }, (error) => {
                should.not.exist(error);

                const eventTypeId = "event-type-id";
                agent
                    .del(`localhost:4000/event-types/${eventTypeId}`)
                    .end((error, response) => {
                        response.status.should.equal(200);
                        response.text.should.equal("Deleted the event type");
                        done();
                    });
            });
        });


        it("Should delete the event type", (done) => {
            state.database.collection("EventTypes").insert({ _id: "event-type-id" }, (error) => {
                should.not.exist(error);

                const eventTypeId = "event-type-id";
                agent
                    .del(`localhost:4000/event-types/${eventTypeId}`)
                    .end((error, response) => {
                        state.database.collection("EventTypes").findOne({ _id: "event-type-id" }, (error, eventType) => {
                            should.not.exist(error);
                            should.not.exist(eventType);
                            done();
                        });
                    });
            });
        });


    });



    describe("PUT /event-types/:eventTypeId", () => {


        it("Should fail if not logged in as admin", (done) => {
            state.validator.validate.adminLoginHeader = (header, callback) => { return callback(false) };
            const eventTypeId = "event-type-id";
            agent
                .put(`localhost:4000/event-types/${eventTypeId}`)
                .end((error, response) => {
                    response.status.should.equal(401);
                    response.text.should.equal("Invalid admin login");
                    done();
                });
        });


        it("Should fail if invalid input", (done) => {
            state.validator.validate.eventTypeChangeInput = (id, input, callback) => { return callback({ message: "Input was invalid" }) };
            const eventTypeId = "event-type-id";
            agent
                .put(`localhost:4000/event-types/${eventTypeId}`)
                .end((error, response) => {
                    response.status.should.equal(400);
                    response.text.should.equal("Input was invalid");
                    done();
                });
        });


        it("Should fail if no event type", (done) => {
            const eventTypeId = "event-type-id";
            const input = { name: "Cars" };
            agent
                .put(`localhost:4000/event-types/${eventTypeId}`)
                .send(input)
                .end((error, response) => {
                    response.status.should.equal(400);
                    response.text.should.equal("Event type does not exist");
                    done();
                });
        });


        it("Should return 200 if succesful", (done) => {
            state.database.collection("EventTypes").insert({ _id: "event-type-id", name: "Camping" }, (error) => {
                should.not.exist(error);

                const eventTypeId = "event-type-id";
                const input = { name: "Cars" };
                agent
                    .put(`localhost:4000/event-types/${eventTypeId}`)
                    .send(input)
                    .end((error, response) => {
                        response.status.should.equal(200);
                        response.text.should.equal("The event type was modified");
                        done();
                    });
            });
        });


        it("Should update the event type", (done) => {
            state.database.collection("EventTypes").insert({ _id: "event-type-id", name: "Camping" }, (error) => {
                should.not.exist(error);

                const eventTypeId = "event-type-id";
                const input = { name: "Cars" };
                agent
                    .put(`localhost:4000/event-types/${eventTypeId}`)
                    .send(input)
                    .end((error, response) => {
                        state.database.collection("EventTypes").findOne({ _id: "event-type-id" }, (error, eventType) => {
                            should.not.exist(error);
                            should.exist(eventType);
                            
                            const expectedEventType = { _id: "event-type-id", name: "Cars" };
                            eventType.should.deep.equal(expectedEventType);
                            done();
                        });
                    });
            });
        });
    });



});
