module.exports = (state) => {



	const loggingFilter = (request, response, next) => {
		const logger = state.logger;
		logger.info(`${request.method} ${request.originalUrl}`);

		next();
	};



	return loggingFilter;
};