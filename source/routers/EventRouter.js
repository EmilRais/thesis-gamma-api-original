const express = require("express");
const LoginFilter = require("../filters/LoginFilter");



module.exports = (state) => {
    const router = express.Router();
    const Login = LoginFilter(state);



    router.get("/approved", (request, response) => {
        state.database.collection("ApprovedEvents").find().toArray((error, result) => {
            if ( error )
                return response.status(500).end("An error occured loading approved events");

            return response.status(200).json(result);
        });
    });



    router.get("/pending", Login.Admin, (request, response) => {
        state.database.collection("PendingEvents").find().toArray((error, result) => {
            if ( error )
                return response.status(500).end("An error occured loading pending events");

            return response.status(200).json(result);
        });
    });



    router.get("/rejected", Login.Admin, (request, response) => {
        state.database.collection("RejectedEvents").find().toArray((error, result) => {
            if ( error )
                return response.status(500).end("An error occured loading rejected events");

            return response.status(200).json(result);
        });
    });



    router.delete("/:eventId", Login.User, (request, response) => {
        const credential = response.locals.credential;
        const eventId = request.params.eventId;
        if ( !eventId ) return response.status(400).end("Missing event id");

        state.database.collection("EnabledUsers").findOne({ _id: credential.userId }, (userError, user) => {
            if ( userError ) return response.status(500).end("Error checking user: " + userError.message);
            if ( !user ) return response.status(500).end("User could not be found");
            if ( user.events.indexOf(eventId) === -1 ) return response.status(401).end("User does not own the event");

            state.database.collection("ApprovedEvents").remove({ _id: eventId }, (approvedError, deletedApprovedEvents) => {
                if ( approvedError )
                    return response.status(500).end("Error deleting approved event: " + approvedError.message);

                const numberOfDeletedEvents = deletedApprovedEvents;
                if ( numberOfDeletedEvents == 0 ) return response.status(400).end("No matching events");

                state.database.collection("EnabledUsers").update({ _id: credential.userId }, { $pull: { events: eventId } }, (userError) => {
                    if ( userError ) return response.status(500).end("Error updating user: " + userError.message);

                    return response.status(200).end("Deleted the event");
                });
            });
        });
    });



    router.delete("/admin/:eventId", Login.Admin, (request, response) => {
        const eventId = request.params.eventId;
        if ( !eventId ) return response.status(400).end("Missing event id");

        state.database.collection("RejectedEvents").remove({ _id: eventId }, (rejectedError, deletedRejectedEvents) => {
            state.database.collection("PendingEvents").remove({ _id: eventId }, (pendingError, deletedPendingEvents) => {
                state.database.collection("ApprovedEvents").remove({ _id: eventId }, (approvedError, deletedApprovedEvents) => {

                    if ( rejectedError )
                        return response.status(500).end("Error deleting rejected event: " + rejectedError.message);

                    if ( pendingError )
                        return response.status(500).end("Error deleting pending event: " + pendingError.message);

                    if ( approvedError )
                        return response.status(500).end("Error deleting approved event: " + approvedError.message);

                    const numberOfDeletedEvents = deletedRejectedEvents + deletedPendingEvents + deletedApprovedEvents;
                    if ( numberOfDeletedEvents == 0 ) return response.status(400).end("No matching events");

                    state.database.collection("EnabledUsers").update({ events: { $in: [eventId] } }, { $pull: { events: eventId } }, (userError) => {
                        if ( userError ) return response.status(500).end("Error updating user: " + userError.message);

                        return response.status(200).end("Deleted the event");
                    });
                });
            });
        });
    });



    router.post("/pending", Login.User, (request, response) => {
        const credential = response.locals.credential;
        const input = request.body;

        state.validator.validate.eventCreationInput(input, (inputError) => {
            if ( inputError ) return response.status(400).end(inputError.message);

            state.database.collection("EnabledUsers").findOne({ _id: credential.userId }, (findUserError, user) => {
                if ( findUserError ) return response.status(500).end("Error checking user: " + findUserError.message);
                if ( !user ) return response.status(500).end("User does not exist");

                const event = state.factory.createEvent(input);
                state.database.collection("PendingEvents").insert(event, function (eventError, results) {
                    if ( eventError ) return response.status(500).end("Error saving event: " + eventError.message);

                    state.database.collection("EnabledUsers").update({ _id: credential.userId }, { $push: { events: event._id } }, (userError) => {
                        if ( userError ) return response.status(500).end("Error updating user: " + userError.message);

                        return response.status(201).json(results[0]);
                    });
                });
            });
        });
    });



    router.post("/approved", Login.Admin, (request, response) => {
        const input = request.body;

        state.validator.validate.eventCreationInput(input, (inputError) => {
            if ( inputError )
                return response.status(400).end(inputError.message);

            const event = state.factory.createEvent(input);
            state.database.collection("ApprovedEvents").insert(event, function (error, results) {
                if ( error )
                    return response.status(500).end("Error saving event" + error);

                return response.status(201).json(results[0]);
            });
        });
    });



    router.post("/:eventId/reject", Login.Admin, (request, response) => {
        const eventId = request.params.eventId;

        const rejectEvent = (collection, event) => {
            state.database.collection("RejectedEvents").insert(event, (rejectError) => {
                if ( rejectError )
                    return response.status(500).end("Unable to reject event");

                state.database.collection(collection).remove({_id: event._id}, (removeError) => {
                    if ( removeError )
                        return response.status(500).end("Unable to fully update approval status");

                    return response.status(200).end();
                });
            });
        };

        state.database.collection("RejectedEvents").findOne({_id: eventId}, (rejectedError, rejectedEvent) => {
            state.database.collection("PendingEvents").findOne({_id: eventId}, (pendingError, pendingEvent) => {
                state.database.collection("ApprovedEvents").findOne({_id: eventId}, (approvedError, approvedEvent) => {
                    
                    if ( rejectedError )
                        return response.status(500).end("Error looking up rejected event: " + rejectedError.message);

                    if ( pendingError )
                        return response.status(500).end("Error looking up pending event: " + pendingError.message);

                    if ( approvedError )
                        return response.status(500).end("Error looking up approved event: " + approvedError.message);

                    if ( rejectedEvent )
                        return response.status(400).end("The event was already rejected");

                    if ( pendingEvent )
                        return rejectEvent("PendingEvents", pendingEvent);

                    if ( approvedEvent )
                        return rejectEvent("ApprovedEvents", approvedEvent);

                    return response.status(400).end("The event could not be found");
                });
            });
        });
    });



    router.post("/:eventId/approve", Login.Admin, (request, response) => {
        const eventId = request.params.eventId;

        const approveEvent = (collection, event) => {
            state.database.collection("ApprovedEvents").insert(event, (approveError) => {
                if ( approveError )
                    return response.status(500).end("Unable to approve event");

                state.database.collection(collection).remove({_id: event._id}, (removeError) => {
                    if ( removeError )
                        return response.status(500).end("Unable to fully update approval status");

                    return response.status(200).end();
                });
            });
        };

        state.database.collection("ApprovedEvents").findOne({_id: eventId}, (approvedError, approvedEvent) => {
            state.database.collection("PendingEvents").findOne({_id: eventId}, (pendingError, pendingEvent) => {
                state.database.collection("RejectedEvents").findOne({_id: eventId}, (rejectedError, rejectedEvent) => {

                    if ( approvedError )
                        return response.status(500).end("Error looking up approved event: " + approvedError.message);

                    if ( pendingError )
                        return response.status(500).end("Error looking up pending event: " + pendingError.message);

                    if ( rejectedError )
                        return response.status(500).end("Error looking up rejected event: " + rejectedError.message);

                    if ( approvedEvent )
                        return response.status(400).end("The event was already approved");

                    if ( pendingEvent )
                        return approveEvent("PendingEvents", pendingEvent);

                    if ( rejectedEvent )
                        return approveEvent("RejectedEvents", rejectedEvent);

                    return response.status(400).end("The event could not be found");
                });
            });
        });
    });



    router.put("/:eventId", Login.Admin, (request, response) => {
        const eventId = request.params.eventId;
        const input = request.body;

        const editEvent = (collection, event) => {
            state.database.collection(collection).update({ _id: event._id }, { $set: input }, (error) => {
                if ( error )
                    return response.status(500).end("Unable to update the event");

                return response.status(200).end("Succesfully edited the event");
            });
        };

        state.validator.validate.eventChangeInput(input, (inputError) => {
            if ( inputError ) return response.status(400).end(inputError.message);

            state.database.collection("ApprovedEvents").findOne({ _id: eventId }, (approvedError, approvedEvent) => {
                state.database.collection("PendingEvents").findOne({ _id: eventId }, (pendingError, pendingEvent) => {
                    state.database.collection("RejectedEvents").findOne({ _id: eventId }, (rejectedError, rejectedEvent) => {

                        if ( approvedError )
                            return response.status(500).end("Error looking up approved event");

                        if ( pendingError )
                            return response.status(500).end("Error looking up pending event");

                        if ( rejectedError )
                            return response.status(500).end("Error looking up rejected event");

                        if ( approvedEvent )
                            return editEvent("ApprovedEvents", approvedEvent);

                        if ( pendingEvent )
                            return editEvent("PendingEvents", pendingEvent);

                        if ( rejectedEvent )
                            return editEvent("RejectedEvents", rejectedEvent);

                        return response.status(400).end("The event could not be found");
                    });
                });
            });
        });
    });



    return router;
};