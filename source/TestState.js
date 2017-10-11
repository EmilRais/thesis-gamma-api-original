const tingodb = require("tingodb");
const TestEngine = tingodb({ memStore: true });
const Random = require("randomstring");
const Calendar = require("./utilities/Calendar");
const Factory = require("./utilities/Factory");


const infuseTestState = (state) => {
	const database = new TestEngine.Db(`build/database${Random.generate(7)}`, {});

	const validator = { validate: {} };
	validator.validate.color = (color, callback) => { callback(undefined) };
	validator.validate.password = (password, callback) => { callback(true) };
	validator.validate.email = (email, callback) => { callback(true) };
	validator.validate.image = (image, callback) => { callback(true) };
	validator.validate.userExists = (id, callback) => { callback(true) };
	validator.validate.adminExists = (id, callback) => { callback(true) };
	validator.validate.notPastDeadline = (date, deadline, callback) => { callback(true) };
	validator.validate.passwordLogin = (login, callback) => { callback(true) };
	validator.validate.facebookLogin = (login, requiredPermissions, callback) => { callback(true) };
	validator.validate.adminLogin = (login, callback) => { callback(true) };
	validator.validate.adminLoginHeader = (header, callback) => { callback(true) };
	validator.validate.userCreationInput = (input, callback) => { callback(true) };
	validator.validate.userCredential = (credential, callback) => { callback(true) };
	validator.validate.userCredentialHeader = (header, callback) => { callback(true) };
	validator.validate.adminCredential = (credential, callback) => { callback(true) };
	
	validator.validate.eventCreationInput = (input, callback) => { callback(undefined) };
	validator.validate.eventChangeInput = (input, callback) => { callback(undefined) };
    validator.validate.eventTypeCreationInput = (input, callback) => { callback(undefined) };
    validator.validate.eventTypeChangeInput = (id, input, callback) => { callback(undefined) };
    validator.validate.settingsChangeInput = (input, callback) => { callback(undefined) };


    const facebook = {};
    facebook.validateData = (login, requiredPermissions, data) => { return true };
    facebook.loadData = (login, callback) => { callback() };

    const logger = { messages: [] };
    logger.info = (message) => { logger.messages.push(message) };
    logger.error = (message) => { logger.messages.push(message); console.log(message) };
    logger.hasLogged = (message) => { return logger.messages.indexOf(message) != -1 };

    state.database = database;
    state.validator = validator;
    state.facebook = facebook;
    state.logger = logger;
    state.calendar = Calendar(state);
    state.factory = new Factory(state);
};


module.exports.infuse = infuseTestState;