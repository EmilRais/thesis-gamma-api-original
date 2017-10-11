const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const LoginRouter = require("./routers/LoginRouter");
const UserRouter = require("./routers/UserRouter");
const EventTypeRouter = require("./routers/EventTypeRouter");
const EventRouter = require("./routers/EventRouter");
const SettingsRouter = require("./routers/SettingsRouter");
const LoggingFilter = require("./filters/LoggingFilter");

module.exports = (state) => {
	const app = express();

	// ONLY NEED IF DEVELOPMENT - NOT PRODUCTION OR TEST
	app.use(cors());

	app.use(bodyParser.json({limit: "1mb"}));
	app.use(bodyParser.urlencoded({ extended: true }));

	app.use(LoggingFilter(state));
	app.use("/", express.static(__dirname + "/../public"));
	app.use("/login", LoginRouter(state));
	app.use("/users", UserRouter(state));
	app.use("/event-types", EventTypeRouter(state));
	app.use("/events", EventRouter(state));
	app.use("/settings", SettingsRouter(state));

	return app;
};