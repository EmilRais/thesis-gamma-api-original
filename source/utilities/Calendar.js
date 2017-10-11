module.exports = (state) => {



	const now = () => {
		return new Date();
	};



	const hoursFromNow = (hours) => {
		const date = state.calendar.now();
		date.setTime(date.getTime() + 1000 * 60 * 60 * hours);
		return date;
	};



	this.now = now;
	this.hoursFromNow = hoursFromNow;
	return this;
};