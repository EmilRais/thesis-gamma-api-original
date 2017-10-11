module.exports = (state) => {



    const parse = (string) => {
        try {
            return JSON.parse(string);
        } catch (e) {
            return undefined;
        }
    };



    const userLoginFilter = (request, response, next) => {
        const header = request.get("Authorization");

        state.validator.validate.userCredentialHeader(header, (validHeader, credential) => {
            if ( !validHeader ) return response.status(401).end("Credential was invalid");

            response.locals.credential = credential;
            next();
        });
    };



    const adminLoginFilter = (request, response, next) => {
        const header = request.get("Authorization");

        state.validator.validate.adminLoginHeader(header, (isValid) => {
            if ( !isValid ) return response.status(401).end("Invalid admin login");
            next();
        });
    };

    

    const filter = {};
    filter.User = userLoginFilter;
    filter.Admin = adminLoginFilter;
    return filter;
};