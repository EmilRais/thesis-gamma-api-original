require("chai").should();
const TestState = require("../source/TestState");

const state = {};
const factory = new (require("../source/utilities/Factory"))(state);

const hours = (hours) => { return 1000 * 60 * 60 * hours };

describe("Factory", () => {

	beforeEach(() => {
		TestState.infuse(state);
	});



	describe("createId", () => {


		it("Should be able to create a unique id of 24 characters", (done) => {
			const id = factory.createId();
			id.should.have.length(24);
			done();
		});


	});



	describe("createImage", () => {


		it("Should be able to create an image", (done) => {
			state.factory.createId = () => { return "image-id" };
			const image = factory.createImage("image-data");
			const expectedImage = { _id: "image-id", image: "image-data" };
			image.should.deep.equal(expectedImage);
			done();
		});


	});



	describe("createUser", () => {


		it("Should be able to create a user", (done) => {
			state.factory.createId = () => { return "user-id" };
			const user = factory.createUser("facebook-user-id");
			
			const expectedUser = { _id: "user-id", facebookUserId: "facebook-user-id", events: [] };
			user.should.deep.equal(expectedUser);
			done();
		});


	});



	describe("createUserCredential", () => {


		it("Should be able to create a user credential", (done) => {
			state.calendar.now = () => { return new Date(500) };
			state.factory.createId = () => { return "credential-id" };
			const user = { _id: "user-id" };
			const credential = factory.createUserCredential(user);

			const expectedCredential = { _id: "credential-id", role: "User", userId: "user-id", expires: 500 + hours(72) };
			credential.should.deep.equal(expectedCredential);
			done();
		});


	});



	describe("createAdminCredential", () => {


		it("Should be able to create an admin credential", (done) => {
			state.calendar.now = () => { return new Date(500) };
			state.factory.createId = () => { return "credential-id" };
			const credential = factory.createAdminCredential();

			const expectedCredential = { _id: "credential-id", role: "Admin", expires: 500 + hours(24) };
			credential.should.deep.equal(expectedCredential);
			done();
		});


	});



	describe("createEvent", () => {


		it("Should be able to create an event", (done) => {
			state.factory.createId = () => { return "event-id" };
			const input = { type: "type-id", title: "title", description: "description", location: "location", startDate: "start-date", endDate: "end-date" };
			const event = factory.createEvent(input);

			const expectedEvent = { _id: "event-id", type: "type-id", title: "title", description: "description", location: "location", startDate: "start-date", endDate: "end-date" };
			event.should.deep.equal(expectedEvent);
			done();
		});


	});



	describe("createEventType", () => {


		it("Should be able to create an event type", (done) => {
			state.factory.createId = () => { return "type-id" };
			const input = { name: "Cars", color: "red-color" };
			const eventType = factory.createEventType(input);

			const expectedEventType = { _id: "type-id", name: "Cars", color: "red-color" };
			eventType.should.deep.equal(expectedEventType);
			done();
		});


	});



});