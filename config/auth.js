module.exports = {
    /**
     * Protecting links to non-logged in users
     */
    ensureAuth: function(req, res, next){
        if(req.user){
            if(req.isAuthenticated()){
                return next();
            }
        }
        // req.flash('errorToast', 'You must be logged in');
        res.json({
            status: 0,
            msg: 'Session Expired/Not Logged in'
        })
        // res.redirect(301, '/admin/');
    }
}