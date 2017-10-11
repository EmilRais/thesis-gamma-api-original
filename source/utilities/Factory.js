const ObjectID = require("mongodb").ObjectID;


module.exports = function (state) {



	const createId = () => {
		return new ObjectID().toHexString();
	};



	const createImage = (imageData) => {
		const id = state.factory.createId();
		return { _id: id, image: imageData };
	};



	const createUser = (facebookUserId) => {
		const id = state.factory.createId();
		return { _id: id, facebookUserId: facebookUserId, events: [] };
	};



	const createUserCredential = (user) => {
		const id = state.factory.createId();
		const expirationDate = state.calendar.hoursFromNow(72);
		return { _id: id, role: "User", userId: user._id, expires: expirationDate.getTime() };
	};



	const createAdminCredential = (user) => {
		const id = state.factory.createId();
		const expirationDate = state.calendar.hoursFromNow(24);
		return { _id: id, role: "Admin", expires: expirationDate.getTime() };
	};



	const createEvent = (input) => {
		const id = state.factory.createId();
		return {
			_id: id,
			type: input.type,
			title: input.title,
			description: input.description,
			location: input.location,
			startDate: input.startDate,
			endDate: input.endDate
		};
	};



	const createEventType = (input) => {
		const id = state.factory.createId();
		return {
			_id: id,
			name: input.name,
			color: input.color
		};
	};



	this.createId = createId;
	this.createImage = createImage;
	this.createUser = createUser;
	this.createUserCredential = createUserCredential;
	this.createAdminCredential = createAdminCredential;

	this.createEvent = createEvent;
	this.createEventType = createEventType;
	return this;
};