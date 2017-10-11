const express = require("express");
const LoginFilter = require("../filters/LoginFilter");



module.exports = (state) => {
    const router = express.Router();
    const Login = LoginFilter(state);



    router.get("/", (request, response) => {
        state.database.collection("EventTypes").find().toArray((error, result) => {
            if ( error )
                return response.status(500).end("An error occured loading event types");

            return response.status(200).json(result);
        });
    });



    router.post("/", Login.Admin, (request, response) => {
        const input = request.body;

        state.validator.validate.eventTypeCreationInput(input, (inputError) => {
            if ( inputError )
                return response.status(400).end(inputError.message);

            const eventType = state.factory.createEventType(input);
            state.database.collection("EventTypes").insert(eventType, (error) => {
                if ( error )
                    return response.status(500).end("Error saving event");

                return response.status(201).end("Created the event type");
            });
        });
    });



    router.delete("/:eventTypeId", Login.Admin, (request, response) => {
        const eventTypeId = request.params.eventTypeId;

        state.database.collection("ApprovedEvents").findOne({ type: eventTypeId }, (approvedError, approvedEvent) => {
            state.database.collection("PendingEvents").findOne({ type: eventTypeId }, (pendingError, pendingEvent) => {
                state.database.collection("RejectedEvents").findOne({ type: eventTypeId }, (rejectedError, rejectedEvent) => {
                    if ( approvedError || pendingError || rejectedError ) return response.status(500).end("Unable to look up event");

                    const event = approvedEvent || pendingEvent || rejectedEvent;
                    if ( event ) return response.status(400).end(`Event type is used by "${event.title}"`);

                    state.database.collection("EventTypes").remove({ _id: eventTypeId }, (error) => {
                        if ( error ) return response.status(500).end("Unable to delete event type");

                        return response.status(200).end("Deleted the event type");
                    });

                });
            });
        });
    });



    router.put("/:eventTypeId", Login.Admin, (request, response) => {
        const eventTypeId = request.params.eventTypeId;
        const input = request.body;

        state.validator.validate.eventTypeChangeInput(eventTypeId, input, (inputError) => {
            if ( inputError ) return response.status(400).end(inputError.message);

            state.database.collection("EventTypes").findOne({ _id: eventTypeId }, (lookupError, eventType) => {
                if ( lookupError ) return response.status(500).end("Unable to look up event type");
                if ( !eventType ) return response.status(400).end("Event type does not exist");

                state.database.collection("EventTypes").update({ _id: eventTypeId }, { $set: input }, (error) => {
                    if ( error ) return response.status(500).end("Unable to update event type");

                    return response.status(200).end("The event type was modified");
                });
            });
        });
    });



    return router;
};