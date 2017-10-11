const should = require("chai").should();
const agent = require("superagent");
const FacebookApp = require("../source/Configuration").facebook;
const TestState = require("../source/TestState");
const Facebook = require("../source/utilities/Facebook")(FacebookApp);

const state = {};
const facebook = Facebook(state);

const loadTestUserLogin = (callback) => {
    agent
        .get("https://graph.facebook.com/" + FacebookApp.appId + "/accounts/test-users")
        .query({ access_token: FacebookApp.appId + "|" + FacebookApp.appSecret })
        .end((error, response) => {
            const data = JSON.parse(response.text);
            const user = data.data[0];
            const login = { userId: user.id, token: user.access_token };

            callback(login);
        });
};

describe("Facebook", () => {

	beforeEach(() => {
        TestState.infuse(state);
    });


	describe("validateData", () => {


		it("Should reject if different app id", (done) => {
			state.calendar.now = () => { return new Date(50000) };
			const login = { facebookUserId: "user-id", token: "user-token" };
			const scopes = [ "email", "user_location" ];
			const data = { app_id: "wrong-app-id", user_id: "user-id", expires_at: 50, is_valid: true, scopes: [ "public_profile", "email", "user_location" ] };
			
			facebook.validateData(login, scopes, data).should.be.false;
			done();
		});


    	it("Should reject if different user id", (done) => {
    		state.calendar.now = () => { return new Date(50000) };
			const login = { facebookUserId: "wrong-user-id", token: "user-token" };
			const scopes = [ "email", "user_location" ];
			const data = { app_id: FacebookApp.appId, user_id: "user-id", expires_at: 50, is_valid: true, scopes: [ "public_profile", "email", "user_location" ] };
			
			facebook.validateData(login, scopes, data).should.be.false;
			done();
    	});


    	it("Should reject if expired", (done) => {
    		state.calendar.now = () => { return new Date(50001) };
			const login = { facebookUserId: "user-id", token: "user-token" };
			const scopes = [ "email", "user_location" ];
			const data = { app_id: FacebookApp.appId, user_id: "user-id", expires_at: 50, is_valid: true, scopes: [ "public_profile", "email", "user_location" ] };
			
			facebook.validateData(login, scopes, data).should.be.false;
			done();
    	});


    	it("Should reject if invalid", (done) => {
    		state.calendar.now = () => { return new Date(50000) };
			const login = { facebookUserId: "user-id", token: "user-token" };
			const scopes = [ "email", "user_location" ];
			const data = { app_id: FacebookApp.appId, user_id: "user-id", expires_at: 50, is_valid: false, scopes: [ "public_profile", "email", "user_location" ] };
			
			facebook.validateData(login, scopes, data).should.be.false;
			done();
    	});


   		it("Should reject if some required permissions have not been granted", (done) => {
   			state.calendar.now = () => { return new Date(50000) };
			const login = { facebookUserId: "user-id", token: "user-token" };
			const scopes = [ "email", "user_location" ];
			const data = { app_id: FacebookApp.appId, user_id: "user-id", expires_at: 50, is_valid: true, scopes: [ "public_profile", "user_location" ] };
			
			facebook.validateData(login, scopes, data).should.be.false;
			done();
   		});
   		

   		it("Should accept if all required permissions have been granted", (done) => {
   			state.calendar.now = () => { return new Date(50000) };
			const login = { facebookUserId: "user-id", token: "user-token" };
			const scopes = [ "email", "user_location" ];
			const data = { app_id: FacebookApp.appId, user_id: "user-id", expires_at: 50, is_valid: true, scopes: [ "email", "user_location" ] };
			
			facebook.validateData(login, scopes, data).should.be.true;
			done();
   		});
   		

   		it("Should accept if more than required permissions have been granted", (done) => {
   			state.calendar.now = () => { return new Date(50000) };
			const login = { facebookUserId: "user-id", token: "user-token" };
			const scopes = [ "email", "user_location" ];
			const data = { app_id: FacebookApp.appId, user_id: "user-id", expires_at: 50, is_valid: true, scopes: [ "public_profile", "email", "user_location" ] };
			
			facebook.validateData(login, scopes, data).should.be.true;
			done();
   		});


	});




    describe("loadData", () => {


    	it("Should not load data for non existing user", (done) => {
    		const login = { userId: "user-id", token: "dogemayn" };
    		facebook.loadData(login, (error, data) => {
    			should.exist(error);
    			should.not.exist(data);
    			done();
    		});
    	});


    	xit("Should load data for existing user", (done) => {
    		loadTestUserLogin((login) => {
    			facebook.loadData(login, (error, data) => {
	    			should.not.exist(error);
	    			should.exist(data);
	    			done();
	    		});
			});
    	});


    });



});
