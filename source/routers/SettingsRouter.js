const express = require("express");
const LoginFilter = require("../filters/LoginFilter");



module.exports = (state) => {
    const router = express.Router();
    const Login = LoginFilter(state);



    router.get("/", Login.User, (request, response) => {
        state.database.collection("Settings").find().toArray((error, settingsArray) => {
            if ( error ) return response.status(500).end("Error loading settings: " + error.message);
            if ( settingsArray.length !== 1 ) return response.status(500).end("Settings are corrupt");

            const settings = settingsArray[0];
            return response.status(200).json(settings);
        });
    });



    router.get("/admin", Login.Admin, (request, response) => {
        state.database.collection("Settings").find().toArray((error, settingsArray) => {
            if ( error ) return response.status(500).end("Error loading settings: " + error.message);
            if ( settingsArray.length !== 1 ) return response.status(500).end("Settings are corrupt");

            const settings = settingsArray[0];
            return response.status(200).json(settings);
        });
    });



    router.put("/", Login.Admin, (request, response) => {
        const input = request.body;
        state.validator.validate.settingsChangeInput(input, (inputError) => {
            if ( inputError ) return response.status(400).end(inputError.message);

            state.database.collection("Settings").update({}, { $set: input }, (error) => {
                if ( error ) return response.status(500).end("Error updating settings: " + error.message);

                return response.status(200).end("Succesfully updated settings");
            });
        });
    });



    return router;
};