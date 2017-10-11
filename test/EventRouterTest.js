const should = require("chai").should();
const agent = require("superagent");

const TestState = require("../source/TestState");

const state = {};
const app = require("../source/Server")(state);
var server = undefined;

describe("EventRouter", () => {

    before((done) => {
        server = app.listen(4000, done);
    });

    beforeEach(() => {
        TestState.infuse(state);
    });

    after((done) => {
        server.close(done);
    });



    describe("GET /events/approved", () => {


        it("Should be able to load 0 approved events", (done) => {
            agent
                .get("localhost:4000/events/approved")
                .end((error, response) => {
                    response.status.should.be.equal(200);
                    response.body.should.be.empty;
                    done();
                });
        });


        it("Should be able to load several approved events", (done) => {
            state.database.collection("ApprovedEvents").insert([{ name: "Cars" }, { title: "Buildings" }], () => {
                agent
                    .get("localhost:4000/events/approved")
                    .end((error, response) => {
                        response.status.should.be.equal(200);
                        response.body.should.have.length(2);
                        done();
                });
            });
        });


    });



    describe("GET /events/pending", () => {


        it("Should fail if not logged in as admin", (done) => {
            state.validator.validate.adminLoginHeader = (header, callback) => { return callback(false) };
            agent
                .get("localhost:4000/events/pending")
                .end((error, response) => {
                    response.status.should.be.equal(401);
                    response.text.should.equal("Invalid admin login");
                    done();
                });
        });


        it("Should be able to load 0 pending events", (done) => {
            agent
                .get("localhost:4000/events/pending")
                .end((error, response) => {
                    response.status.should.be.equal(200);
                    response.body.should.be.empty;
                    done();
                });
        });


        it("Should be able to load several pending events", (done) => {
            state.database.collection("PendingEvents").insert([{ title: "Cars" }, { title: "Buildings" }], () => {
                agent
                    .get("localhost:4000/events/pending")
                    .end((error, response) => {
                        response.status.should.be.equal(200);
                        response.body.should.have.length(2);
                        done();
                });
            });
        });


    });



    describe("GET /events/rejected", () => {


        it("Should fail if not logged in as admin", (done) => {
            state.validator.validate.adminLoginHeader = (header, callback) => { return callback(false) };
            agent
                .get("localhost:4000/events/rejected")
                .end((error, response) => {
                    response.status.should.be.equal(401);
                    response.text.should.equal("Invalid admin login");
                    done();
                });
        });


        it("Should be able to load 0 rejected events", (done) => {
            agent
                .get("localhost:4000/events/rejected")
                .end((error, response) => {
                    response.status.should.be.equal(200);
                    response.body.should.be.empty;
                    done();
                });
        });


        it("Should be able to load several rejected events", (done) => {
            state.database.collection("RejectedEvents").insert([{ title: "Cars" }, { title: "Buildings" }], () => {
                agent
                    .get("localhost:4000/events/rejected")
                    .end((error, response) => {
                        response.status.should.be.equal(200);
                        response.body.should.have.length(2);
                        done();
                });
            });
        });


    });



    describe("DELETE /events/:eventId", () => {


        it("Should fail if not logged in as user", (done) => {
            state.validator.validate.userCredentialHeader = (header, callback) => { return callback(false) };
            agent
                .del("localhost:4000/events/fake-id")
                .end((error, response) => {
                    response.status.should.equal(401);
                    response.text.should.equal("Credential was invalid");
                    done();
                });
        });


        it("Should fail if no user", (done) => {
            state.validator.validate.userCredentialHeader = (header, callback) => { return callback(true, { userId: "user-id" }) };
            agent
                .del("localhost:4000/events/fake-id")
                .end((error, response) => {
                    response.status.should.equal(500);
                    response.text.should.equal("User could not be found");
                    done();
                });
        });


        it("Should fail if user does not own event", (done) => {
            state.validator.validate.userCredentialHeader = (header, callback) => { return callback(true, { userId: "user-id" }) };
            state.database.collection("ApprovedEvents").insert({ _id: "event-id" }, (eventError) => {
                state.database.collection("EnabledUsers").insert({ _id: "user-id", events: [] }, (userError) => {
                    should.not.exist(eventError);
                    should.not.exist(userError);

                    agent
                        .del("localhost:4000/events/event-id")
                        .end((error, response) => {
                            response.status.should.equal(401);
                            response.text.should.equal("User does not own the event");
                            done();
                        });
                });
            });
        });


        it("Should fail if no events matched event id", (done) => {
            state.validator.validate.userCredentialHeader = (header, callback) => { return callback(true, { userId: "user-id" }) };
            state.database.collection("EnabledUsers").insert({ _id: "user-id", events: ["fake-id"] }, (userError) => {
                should.not.exist(userError);

                agent
                    .del("localhost:4000/events/fake-id")
                    .end((error, response) => {
                        response.status.should.equal(400);
                        response.text.should.equal("No matching events");
                        done();
                    });
            });
        });


        it("Should return 200 if deleted an event", (done) => {
            state.validator.validate.userCredentialHeader = (header, callback) => { return callback(true, { userId: "user-id" }) };
            state.database.collection("ApprovedEvents").insert({ _id: "event-id" }, (eventError) => {
                state.database.collection("EnabledUsers").insert({ _id: "user-id", events: ["event-id"] }, (userError) => {
                    should.not.exist(eventError);
                    should.not.exist(userError);

                    agent
                        .del("localhost:4000/events/event-id")
                        .end((error, response) => {
                            response.status.should.equal(200);
                            response.text.should.equal("Deleted the event");
                            done();
                        });
                });
            });
        });


        it("Should delete event from ApprovedEvents", (done) => {
            state.validator.validate.userCredentialHeader = (header, callback) => { return callback(true, { userId: "user-id" }) };
            state.database.collection("ApprovedEvents").insert({ _id: "event-id" }, (eventError) => {
                state.database.collection("EnabledUsers").insert({ _id: "user-id", events: ["event-id"] }, (userError) => {
                    should.not.exist(eventError);
                    should.not.exist(userError);

                    agent
                        .del("localhost:4000/events/event-id")
                        .end((error, response) => {
                            state.database.collection("ApprovedEvents").findOne({ _id: "event-id" }, (error, event) => {
                                should.not.exist(error);
                                should.not.exist(event);
                                done();
                            });
                        });
                });
            });
        });


        it("Should delete event from user", (done) => {
            state.validator.validate.userCredentialHeader = (header, callback) => { return callback(true, { userId: "user-id" }) };
            state.database.collection("ApprovedEvents").insert({ _id: "event-id" }, (eventError) => {
                state.database.collection("EnabledUsers").insert({ _id: "user-id", events: ["event-id"] }, (userError) => {
                    should.not.exist(eventError);
                    should.not.exist(userError);

                    agent
                        .del("localhost:4000/events/event-id")
                        .end((error, response) => {
                            state.database.collection("EnabledUsers").findOne({ _id: "user-id" }, (error, user) => {
                                should.not.exist(error);
                                should.exist(user);

                                user.events.should.not.include("event-id");
                                done();
                            });
                        });
                });
            });
        });


    });



    describe("DELETE /events/admin/:eventId", () => {


        it("Should fail if not logged in as admin", (done) => {
            state.validator.validate.adminLoginHeader = (header, callback) => { return callback(false) };
            agent
                .del("localhost:4000/events/admin/fake-id")
                .end((error, response) => {
                    response.status.should.equal(401);
                    response.text.should.equal("Invalid admin login");
                    done();
                });
        });


        it("Should fail if no events matched event id", (done) => {
            agent
                .del("localhost:4000/events/admin/fake-id")
                .end((error, response) => {
                    response.status.should.equal(400);
                    response.text.should.equal("No matching events");
                    done();
                });
        });


        it("Should return 200 if deleted an event", (done) => {
            state.database.collection("RejectedEvents").insert({ _id: "event-id" }, (error) => {
                should.not.exist(error);

                agent
                    .del("localhost:4000/events/admin/event-id")
                    .end((error, response) => {
                        response.status.should.equal(200);
                        response.text.should.equal("Deleted the event");
                        done();
                    });
            });
        });


        it("Should delete event from RejectedEvents", (done) => {
            state.database.collection("RejectedEvents").insert({ _id: "event-id" }, (error) => {
                should.not.exist(error);

                agent
                    .del("localhost:4000/events/admin/event-id")
                    .end((error, response) => {
                        state.database.collection("RejectedEvents").findOne({ _id: "event-id" }, (error, event) => {
                            should.not.exist(error);
                            should.not.exist(event);
                            done();
                        });
                    });
            });
        });


        it("Should delete event from PendingEvents", (done) => {
            state.database.collection("PendingEvents").insert({ _id: "event-id" }, (error) => {
                should.not.exist(error);

                agent
                    .del("localhost:4000/events/admin/event-id")
                    .end((error, response) => {
                        state.database.collection("PendingEvents").findOne({ _id: "event-id" }, (error, event) => {
                            should.not.exist(error);
                            should.not.exist(event);
                            done();
                        });
                    });
            });
        });


        it("Should delete event from ApprovedEvents", (done) => {
            state.database.collection("ApprovedEvents").insert({ _id: "event-id" }, (error) => {
                should.not.exist(error);

                agent
                    .del("localhost:4000/events/admin/event-id")
                    .end((error, response) => {
                        state.database.collection("ApprovedEvents").findOne({ _id: "event-id" }, (error, event) => {
                            should.not.exist(error);
                            should.not.exist(event);
                            done();
                        });
                    });
            });
        });


        it("Should delete event from user", (done) => {
            state.database.collection("ApprovedEvents").insert({ _id: "event-id" }, (eventError) => {
                state.database.collection("EnabledUsers").insert({ _id: "user-id", events: ["event-id"] }, (userError) => {
                    should.not.exist(eventError);
                    should.not.exist(userError);

                    agent
                        .del("localhost:4000/events/admin/event-id")
                        .end((error, response) => {
                            state.database.collection("EnabledUsers").findOne({ _id: "user-id" }, (error, user) => {
                                should.not.exist(error);
                                should.exist(user);

                                user.events.should.not.include("event-id");
                                done();
                            });
                        });
                });
            });
        });


    });



    describe("POST /events/pending", () => {


        it("Should fail if not logged in as user", (done) => {
            state.validator.validate.userCredentialHeader = (header, callback) => { return callback(false) };
            agent
                .post("localhost:4000/events/pending")
                .end((error, response) => {
                    response.status.should.equal(401);
                    response.text.should.equal("Credential was invalid");
                    done();
                });
        });


        it("Should fail if invalid input", (done) => {
            state.validator.validate.eventCreationInput = (input, callback) => { return callback({ message: "Input was invalid" }) };
            agent
                .post("localhost:4000/events/pending")
                .end((error, response) => {
                    response.status.should.equal(400);
                    response.text.should.equal("Input was invalid");
                    done();
                });
        });


        it("Should fail if no user", (done) => {
            state.validator.validate.userCredentialHeader = (credential, callback) => { return callback(true, { userId: "user-id" }) };
            state.factory.createId = () => { return "event-id" };

            const input =  { title: "Biler" };
            agent
                .post("localhost:4000/events/pending")
                .send(input)
                .end((error, response) => {
                    response.status.should.equal(500);
                    console.log(response.text);
                    response.text.should.equal("User does not exist");
                    done();
                });
        });


        it("Should return 201 when succesful", (done) => {
            state.database.collection("EnabledUsers").insert({ _id: "user-id", events: [] }, (error) => {
                should.not.exist(error);

                state.validator.validate.userCredentialHeader = (credential, callback) => { return callback(true, { userId: "user-id" }) };
                const input =  { title: "Biler" };
                agent
                    .post("localhost:4000/events/pending")
                    .send(input)
                    .end((error, response) => {
                        response.status.should.equal(201);
                        done();
                    });
            });
        });


        it("Should create and store event", (done) => {
            state.database.collection("EnabledUsers").insert({ _id: "user-id", events: [] }, (error) => {
                should.not.exist(error);

                state.validator.validate.userCredentialHeader = (credential, callback) => { return callback(true, { userId: "user-id" }) };
                state.factory.createId = () => { return "event-id" };

                const input =  { title: "Biler" };
                agent
                    .post("localhost:4000/events/pending")
                    .send(input)
                    .end((error, response) => {
                        state.database.collection("PendingEvents").findOne({ _id: "event-id" }, (error, storedEvent) => {
                            should.not.exist(error);
                            should.exist(storedEvent);
                            
                            const expectedEvent = { _id: "event-id", type: undefined, title: "Biler", description: undefined, location: undefined, startDate: undefined, endDate: undefined };
                            storedEvent.should.deep.equal(expectedEvent);
                            done();
                        });
                    });
            });
        });


        it("Should update the user", (done) => {
            state.database.collection("EnabledUsers").insert({ _id: "user-id", events: [] }, (error) => {
                should.not.exist(error);

                state.validator.validate.userCredentialHeader = (credential, callback) => { return callback(true, { userId: "user-id" }) };
                state.factory.createId = () => { return "event-id" };

                const input =  { title: "Biler" };
                agent
                    .post("localhost:4000/events/pending")
                    .send(input)
                    .end((error, response) => {
                        state.database.collection("EnabledUsers").findOne({ _id: "user-id" }, (error, user) => {
                            should.not.exist(error);
                            should.exist(user);

                            user.events.should.include("event-id");
                            done();
                        });
                    });
            });
        });


        it("Should return the created event", (done) => {
            state.database.collection("EnabledUsers").insert({ _id: "user-id", events: [] }, (error) => {
                should.not.exist(error);

                state.validator.validate.userCredentialHeader = (credential, callback) => { return callback(true, { userId: "user-id" }) };
                state.factory.createId = () => { return "event-id" };
                const input =  { title: "Biler" };
                agent
                    .post("localhost:4000/events/pending")
                    .send(input)
                    .end((error, response) => {
                        const expectedEvent = { _id: "event-id", title: "Biler" };
                        response.body.should.deep.equal(expectedEvent);
                        done();
                    });
            });
        });


    });



    describe("POST /events/approved", () => {


        it("Should fail if not logged in as admin", (done) => {
            state.validator.validate.adminLoginHeader = (header, callback) => { return callback(false) };
            agent
                .post("localhost:4000/events/approved")
                .end((error, response) => {
                    response.status.should.equal(401);
                    response.text.should.equal("Invalid admin login");
                    done();
                });
        });


        it("Should fail if invalid input", (done) => {
            state.validator.validate.eventCreationInput = (input, callback) => { return callback({ message: "Input was invalid" }) };
            agent
                .post("localhost:4000/events/approved")
                .end((error, response) => {
                    response.status.should.equal(400);
                    response.text.should.equal("Input was invalid");
                    done();
                });
        });


        it("Should create and store event", (done) => {
            state.factory.createId = () => { return "event-id" };
            const input =  { title: "Biler" };
            agent
                .post("localhost:4000/events/approved")
                .send(input)
                .end((error, response) => {
                    state.database.collection("ApprovedEvents").findOne({_id: "event-id"}, (error, storedEvent) => {
                        should.not.exist(error);
                        should.exist(storedEvent);

                        const expectedEvent = { _id: "event-id", type: undefined, title: "Biler", description: undefined, location: undefined, startDate: undefined, endDate: undefined };
                        storedEvent.should.deep.equal(expectedEvent);
                        done();
                    });
                });
        });


        it("Should return 201 when succesful", (done) => {
            const input =  { title: "Biler" };
            agent
                .post("localhost:4000/events/approved")
                .send(input)
                .end((error, response) => {
                    response.status.should.equal(201);
                    done();
                });
        });


        it("Should return the created event", (done) => {
            state.factory.createId = () => { return "event-id" };
            const input =  { title: "Biler" };
            agent
                .post("localhost:4000/events/approved")
                .send(input)
                .end((error, response) => {
                    const expectedEvent = { _id: "event-id", title: "Biler" };
                    response.body.should.deep.equal(expectedEvent);
                    done();
                });
        });


    });



    describe("POST /events/:eventId/reject", () => {
        

        it("Should fail if not logged in as admin", (done) => {
            state.validator.validate.adminLoginHeader = (header, callback) => { return callback(false) };
            const eventId = "event-that-does-not-exist";
            agent
                .post(`localhost:4000/events/${eventId}/reject`)
                .end((error, response) => {
                    response.status.should.equal(401);
                    response.text.should.equal("Invalid admin login");
                    done();
                });
        });


        it("Should fail if event does not exist", (done) => {
            const eventId = "event-that-does-not-exist";
            agent
                .post(`localhost:4000/events/${eventId}/reject`)
                .end((error, response) => {
                    response.status.should.equal(400);
                    response.text.should.equal("The event could not be found");
                    done();
                });
        });


        it("Should fail if event is already rejected", (done) => {
            state.database.collection("RejectedEvents").insert({ _id: "abc", title: "Halbal i Mariager" }, () => {
                const eventId = "abc";
                agent
                    .post(`localhost:4000/events/${eventId}/reject`)
                    .end((error, response) => {
                        response.status.should.equal(400);
                        response.text.should.equal("The event was already rejected");
                        done();
                    });
            })
        });


        it("Should reject if event is pending", (done) => {
            state.database.collection("PendingEvents").insert({ _id: "abc", title: "Halbal i Mariager" }, () => {
                const eventId = "abc";
                agent
                    .post(`localhost:4000/events/${eventId}/reject`)
                    .end((error, response) => {
                        response.status.should.equal(200);

                        state.database.collection("PendingEvents").findOne({ _id: "abc" }, (error, pendingEvent) => {
                            should.not.exist(pendingEvent);

                            state.database.collection("RejectedEvents").findOne({ _id: "abc" }, (error, rejectedEvent) => {
                                should.exist(rejectedEvent);
                                done();
                            });
                        });
                    });
            })
        });


        it("Should reject if event is approved", (done) => {
            state.database.collection("ApprovedEvents").insert({ _id: "abc", title: "Halbal i Mariager" }, () => {
                const eventId = "abc";
                agent
                    .post(`localhost:4000/events/${eventId}/reject`)
                    .end((error, response) => {
                        response.status.should.be.equal(200);

                        state.database.collection("ApprovedEvents").findOne({ _id: "abc" }, (error, approvedEvent) => {
                            should.not.exist(approvedEvent);

                            state.database.collection("RejectedEvents").findOne({ _id: "abc" }, (error, rejectedEvent) => {
                                should.exist(rejectedEvent);
                                done();
                            });
                        });
                    });
            })
        });
    });



    describe("POST /events/:eventId/approve", () => {


        it("Should fail if not logged in as admin", (done) => {
            state.validator.validate.adminLoginHeader = (header, callback) => { return callback(false) };
            const eventId = "event-that-does-not-exist"
            agent
                .post(`localhost:4000/events/${eventId}/approve`)
                .end((error, response) => {
                    response.status.should.equal(401);
                    response.text.should.equal("Invalid admin login");
                    done();
                });
        });


        it("Should fail if event does not exist", (done) => {
            const eventId = "event-that-does-not-exist"
            agent
                .post(`localhost:4000/events/${eventId}/approve`)
                .end((error, response) => {
                    response.status.should.equal(400);
                    response.text.should.equal("The event could not be found");
                    done();
                });
        });


        it("Should fail if event is already approved", (done) => {
            state.database.collection("ApprovedEvents").insert({ _id: "abc", title: "Halbal i Mariager" }, () => {
                const eventId = "abc";
                agent
                    .post(`localhost:4000/events/${eventId}/approve`)
                    .end((error, response) => {
                        response.status.should.equal(400);
                        response.text.should.equal("The event was already approved");
                        done();
                    });
            })
        });


        it("Should approve if event is pending", (done) => {
            state.database.collection("PendingEvents").insert({ _id: "abc", title: "Halbal i Mariager" }, () => {
                const eventId = "abc";
                agent
                    .post(`localhost:4000/events/${eventId}/approve`)
                    .end((error, response) => {
                        response.status.should.equal(200);

                        state.database.collection("PendingEvents").findOne({ _id: "abc" }, (error, pendingEvent) => {
                            should.not.exist(pendingEvent);

                            state.database.collection("ApprovedEvents").findOne({ _id: "abc" }, (error, approvedEvent) => {
                                should.exist(approvedEvent);
                                done();
                            });
                        });
                    });
            })
        });


        it("Should approve if event is rejected", (done) => {
            state.database.collection("RejectedEvents").insert({ _id: "abc", title: "Halbal i Mariager" }, () => {
                const eventId = "abc";
                agent
                    .post(`localhost:4000/events/${eventId}/approve`)
                    .end((error, response) => {
                        response.status.should.equal(200);

                        state.database.collection("RejectedEvents").findOne({ _id: "abc" }, (error, rejectedEvent) => {
                            should.not.exist(rejectedEvent);

                            state.database.collection("ApprovedEvents").findOne({ _id: "abc" }, (error, approvedEvent) => {
                                should.exist(approvedEvent);
                                done();
                            });
                        });
                    });
            })
        });


    });



    describe("PUT /events/:eventId", () => {


        it("Should fail if not logged in as admin", (done) => {
            state.validator.validate.adminLoginHeader = (header, callback) => { return callback(false) };
            const eventId = "unknown-event";
            agent
                .put(`localhost:4000/events/${eventId}`)
                .end((error, response) => {
                    response.status.should.equal(401);
                    response.text.should.equal("Invalid admin login");
                    done();
                });
        });


        it("Should fail if input is invalid", (done) => {
            state.validator.validate.eventChangeInput = (input, callback) => { return callback({ message: "The input was invalid" }) };
            const eventId = "unknown-event";
            const input = {};
            agent
                .put(`localhost:4000/events/${eventId}`)
                .send(input)
                .end((error, response) => {
                    response.status.should.equal(400);
                    response.text.should.equal("The input was invalid");
                    done();
                });
        });


        it("Should fail if event does not exist", (done) => {
            const eventId = "unknown-event";
            const input = {};
            agent
                .put(`localhost:4000/events/${eventId}`)
                .send(input)
                .end((error, response) => {
                    response.status.should.equal(400);
                    response.text.should.equal("The event could not be found");
                    done();
                });
        });

        it("Should return 200 when succesful", (done) => {
            state.database.collection("ApprovedEvents").insert({ _id: "some-event" }, (error) => {
                should.not.exist(error);

                const eventId = "some-event";
                const input = {};
                agent
                    .put(`localhost:4000/events/${eventId}`)
                    .send(input)
                    .end((error, response) => {
                        response.status.should.equal(200);
                        response.text.should.equal("Succesfully edited the event");
                        done();
                    });
            });
        });


        it("Should be able to edit event type", (done) => {
            const event = { _id: "some-event", type: "event-type-id", title: "title", description: "description", location: "location", startDate: "start-date", endDate: "end-date" };
            state.database.collection("ApprovedEvents").insert(event, (error) => {
                should.not.exist(error);

                const eventId = "some-event";
                const input = { type: "other-event-type-id" };
                agent
                    .put(`localhost:4000/events/${eventId}`)
                    .send(input)
                    .end((error, response) => {
                        state.database.collection("ApprovedEvents").findOne({ _id: "some-event"}, (error, event) => {
                            should.not.exist(error);
                            should.exist(event);
                            event.type.should.equal("other-event-type-id");
                            done();
                        });
                    });
            });
        });


        it("Should be able to edit event title", (done) => {
            const event = { _id: "some-event", type: "event-type-id", title: "title", description: "description", location: "location", startDate: "start-date", endDate: "end-date" };
            state.database.collection("ApprovedEvents").insert(event, (error) => {
                should.not.exist(error);

                const eventId = "some-event";
                const input = { title: "other-title" };
                agent
                    .put(`localhost:4000/events/${eventId}`)
                    .send(input)
                    .end((error, response) => {
                        state.database.collection("ApprovedEvents").findOne({ _id: "some-event"}, (error, event) => {
                            should.not.exist(error);
                            should.exist(event);
                            event.title.should.equal("other-title");
                            done();
                        });
                    });
            });
        });


        it("Should be able to edit event description", (done) => {
            const event = { _id: "some-event", type: "event-type-id", title: "title", description: "description", location: "location", startDate: "start-date", endDate: "end-date" };
            state.database.collection("ApprovedEvents").insert(event, (error) => {
                should.not.exist(error);

                const eventId = "some-event";
                const input = { description: "other-description" };
                agent
                    .put(`localhost:4000/events/${eventId}`)
                    .send(input)
                    .end((error, response) => {
                        state.database.collection("ApprovedEvents").findOne({ _id: "some-event"}, (error, event) => {
                            should.not.exist(error);
                            should.exist(event);
                            event.description.should.equal("other-description");
                            done();
                        });
                    });
            });
        });


        it("Should be able to edit event location", (done) => {
            const event = { _id: "some-event", type: "event-type-id", title: "title", description: "description", location: "location", startDate: "start-date", endDate: "end-date" };
            state.database.collection("ApprovedEvents").insert(event, (error) => {
                should.not.exist(error);

                const eventId = "some-event";
                const input = { location: "other-location" };
                agent
                    .put(`localhost:4000/events/${eventId}`)
                    .send(input)
                    .end((error, response) => {
                        state.database.collection("ApprovedEvents").findOne({ _id: "some-event"}, (error, event) => {
                            should.not.exist(error);
                            should.exist(event);
                            event.location.should.equal("other-location");
                            done();
                        });
                    });
            });
        });


        it("Should be able to edit event start date", (done) => {
            const event = { _id: "some-event", type: "event-type-id", title: "title", description: "description", location: "location", startDate: "start-date", endDate: "end-date" };
            state.database.collection("ApprovedEvents").insert(event, (error) => {
                should.not.exist(error);

                const eventId = "some-event";
                const input = { startDate: "other-start-date" };
                agent
                    .put(`localhost:4000/events/${eventId}`)
                    .send(input)
                    .end((error, response) => {
                        state.database.collection("ApprovedEvents").findOne({ _id: "some-event"}, (error, event) => {
                            should.not.exist(error);
                            should.exist(event);
                            event.startDate.should.equal("other-start-date");
                            done();
                        });
                    });
            });
        });


        it("Should be able to edit event end date", (done) => {
            const event = { _id: "some-event", type: "event-type-id", title: "title", description: "description", location: "location", startDate: "start-date", endDate: "end-date" };
            state.database.collection("ApprovedEvents").insert(event, (error) => {
                should.not.exist(error);

                const eventId = "some-event";
                const input = { endDate: "other-end-date" };
                agent
                    .put(`localhost:4000/events/${eventId}`)
                    .send(input)
                    .end((error, response) => {
                        state.database.collection("ApprovedEvents").findOne({ _id: "some-event"}, (error, event) => {
                            should.not.exist(error);
                            should.exist(event);
                            event.endDate.should.equal("other-end-date");
                            done();
                        });
                    });
            });
        });


        it("Should be able to edit several fields at once", (done) => {
            const event = { _id: "some-event", type: "event-type-id", title: "title", description: "description", location: "location", startDate: "start-date", endDate: "end-date" };
            state.database.collection("ApprovedEvents").insert(event, (error) => {
                should.not.exist(error);

                const eventId = "some-event";
                const input = { description: "other-description", location: "other-location" };
                agent
                    .put(`localhost:4000/events/${eventId}`)
                    .send(input)
                    .end((error, response) => {
                        state.database.collection("ApprovedEvents").findOne({ _id: "some-event"}, (error, event) => {
                            should.not.exist(error);
                            should.exist(event);
                            event.title.should.equal("title");
                            event.description.should.equal("other-description");
                            event.location.should.equal("other-location");
                            done();
                        });
                    });
            });
        });


        it("Should be able to edit an approved event", (done) => {
            const event = { _id: "some-event", type: "event-type-id", title: "title", description: "description", location: "location", startDate: "start-date", endDate: "end-date" };
            state.database.collection("ApprovedEvents").insert(event, (error) => {
                should.not.exist(error);

                const eventId = "some-event";
                const input = { title: "other-title" };
                agent
                    .put(`localhost:4000/events/${eventId}`)
                    .send(input)
                    .end((error, response) => {
                        state.database.collection("ApprovedEvents").findOne({ _id: "some-event"}, (error, event) => {
                            should.not.exist(error);
                            should.exist(event);
                            event.title.should.equal("other-title");
                            done();
                        });
                    });
            });
        });

        it("Should be able to edit a pending event", (done) => {
            const event = { _id: "some-event", type: "event-type-id", title: "title", description: "description", location: "location", startDate: "start-date", endDate: "end-date" };
            state.database.collection("PendingEvents").insert(event, (error) => {
                should.not.exist(error);

                const eventId = "some-event";
                const input = { title: "other-title" };
                agent
                    .put(`localhost:4000/events/${eventId}`)
                    .send(input)
                    .end((error, response) => {
                        state.database.collection("PendingEvents").findOne({ _id: "some-event"}, (error, event) => {
                            should.not.exist(error);
                            should.exist(event);
                            event.title.should.equal("other-title");
                            done();
                        });
                    });
            });
        });


        it("Should be able to edit a rejected event", (done) => {
            const event = { _id: "some-event", type: "event-type-id", title: "title", description: "description", location: "location", startDate: "start-date", endDate: "end-date" };
            state.database.collection("RejectedEvents").insert(event, (error) => {
                should.not.exist(error);

                const eventId = "some-event";
                const input = { title: "other-title" };
                agent
                    .put(`localhost:4000/events/${eventId}`)
                    .send(input)
                    .end((error, response) => {
                        state.database.collection("RejectedEvents").findOne({ _id: "some-event"}, (error, event) => {
                            should.not.exist(error);
                            should.exist(event);
                            event.title.should.equal("other-title");
                            done();
                        });
                    });
            });
        });


    });



});
