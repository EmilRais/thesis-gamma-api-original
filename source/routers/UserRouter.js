const express = require("express");
const ObjectID = require('mongodb').ObjectID;
const LoginFilter = require("../filters/LoginFilter");


module.exports = (state) => {
    const router = express.Router();
    const Login = LoginFilter(state);



    router.post("/enabled/exists", (request, response) => {
        const login = request.body;
        state.validator.validate.facebookLogin(login, ["public_profile"], (isValid) => {
            if ( !isValid )
                return response.status(400).end("Login was not valid");

            state.database.collection("EnabledUsers").findOne({facebookUserId: login.facebookUserId}, function (error, result) {
                if ( error )
                    return response.status(500).end("Unable to check existing user");

                if ( !result )
                    return response.status(204).end();
                
                return response.status(200).end("The user exists");
            });
        });
    });



    router.post("/enabled", (request, response) => {
        const login = request.body;
        state.validator.validate.facebookLogin(login, ["public_profile"], (isValid) => {
            if ( !isValid )
                return response.status(400).end("Login was not valid");

            state.database.collection("EnabledUsers").findOne({facebookUserId: login.facebookUserId}, function (error, result) {
                if ( error )
                    return response.status(401).end("Unable to check user");

                if ( result )
                    return response.status(401).end("User already exists");

                const user = state.factory.createUser(login.facebookUserId);
                state.database.collection("EnabledUsers").insert(user, function (error, result) {
                    if ( error )
                        return response.status(500).end("Unable to save user");

                    return response.status(201).end("Created the user");
                });
            });
        });
    });



    router.post("/:userId/disable", Login.Admin, (request, response) => {
        const userId = request.params.userId;

        const disableUser = (user) => {
            state.database.collection("DisabledUsers").insert(user, (error) => {
                if ( error ) return response.status(500).end("Error disabling user");

                state.database.collection("EnabledUsers").remove({ _id: user._id }, (error, count) => {
                    if ( error ) return response.status(500).end("Error disabling user");

                    return response.status(200).end("Succesfully disabled the user");
                });
            });
        };

        state.database.collection("EnabledUsers").findOne({ _id: userId }, (enabledError, enabledUser) => {
            state.database.collection("DisabledUsers").findOne({ _id: userId }, (disabledError, disabledUser) => {
                
                if ( enabledError )
                    return response.status(500).end("Error looking up enabled user");

                if ( disabledError )
                    return response.status(500).end("Error looking up disabled user");

                if ( disabledUser )
                    return response.status(400).end("The user was already disabled");

                if ( enabledUser )
                    return disableUser(enabledUser);

                return response.status(400).end("The user could not be found");
            });
        });
    });



    router.post("/:userId/enable", Login.Admin, (request, response) => {
        const userId = request.params.userId;

        const enableUser = (user) => {
            state.database.collection("EnabledUsers").insert(user, (error) => {
                if ( error ) return response.status(500).end("Error enabling user");

                state.database.collection("DisabledUsers").remove({ _id: user._id }, (error) => {
                    if ( error ) return response.status(500).end("Error enabling user");

                    return response.status(200).end("Succesfully enabled the user");
                });
            });
        };

        state.database.collection("EnabledUsers").findOne({ _id: userId }, (enabledError, enabledUser) => {
            state.database.collection("DisabledUsers").findOne({ _id: userId }, (disabledError, disabledUser) => {
                
                if ( enabledError )
                    return response.status(500).end("Error looking up enabled user");

                if ( disabledError )
                    return response.status(500).end("Error looking up disabled user");

                if ( enabledUser )
                    return response.status(400).end("The user was already enabled");

                if ( disabledUser )
                    return enableUser(disabledUser);

                return response.status(400).end("The user could not be found");
            });
        });
    });



    router.get("/:state", Login.Admin, (request, response) => {
        const userState = request.params.state;

        const collections = { "enabled": "EnabledUsers", "disabled": "DisabledUsers" };
        const collection = collections[userState];
        if ( !collection ) return response.status(400).end("Unrecognised user state");

        state.database.collection(collection).find().toArray((error, users) => {
            if ( error )
                return response.status(500).end("Unable to load users");

            return response.status(200).json(users);
        });
    });



    router.delete("/:userId", Login.Admin, (request, response) => {
        const userId = request.params.userId;

        state.database.collection("EnabledUsers").remove({ _id: userId }, (enabledError) => {
            state.database.collection("DisabledUsers").remove({ _id: userId}, (disabledError) => {
                if ( enabledError ) return response.status(500).end("Unable to delete enabled user");
                if ( disabledError ) return response.status(500).end("Unable to delete disabled user");

                return response.status(200).end("Deleted the user");
            });
        });
    });



    return router;
};