'use strict';

const PORT = 3000;

/*** Importing modules ***/
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const dayjs = require('dayjs');

const { check, validationResult, } = require('express-validator'); //validation middleware

const cmsDao = require('./dao-cms'); // module for accessing the table 'pages' in the DB
const userDao = require('./dao-users'); // module for accessing the table 'users' in the DB

/*** init express and set-up the middlewares ***/
const app = express();
app.use(morgan('combined'));
app.use(express.json());
app.use(express.static('public'));

/** Set up and enable Cross-Origin Resource Sharing (CORS) **/
const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
  };
app.use(cors(corsOptions));



/*** Passport ***/

/** Authentication-related imports **/
const passport = require('passport');
const LocalStrategy = require('passport-local');

/** Set up authentication strategy to search in the DB a user with a matching password.
 * The user object will contain other information extracted by the method userDao.getUser
 **/
passport.use(new LocalStrategy(async function verify(username, password, callback) {
  const user = await userDao.getUser(username, password)
  if(!user)
    return callback(null, false, 'Incorrect username or password');  
    
  return callback(null, user);
}));

// Serializing in the session the user object given from LocalStrategy(verify).
passport.serializeUser(function (user, callback) {
    callback(null, user);
});

// Starting from the data in the session, we extract the current (logged-in) user.
passport.deserializeUser(function (user, callback) {

  return callback(null, user);
});

/** Creating the session */
const session = require('express-session');

app.use(session({
  secret: "keep calm and... be secret!",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));


/** Defining authentication verification middleware **/
const isLoggedIn = (req, res, next) => {
    if(req.isAuthenticated()) {
      return next();
    }

    return res.status(401).json({error: 'Not authorized'});
}

/** Defining admin authentication verification middleware **/
const isAdmin = (req, res, next) => {
    if(req.user.admin_role===1) {
      return next();
    }
    return res.status(401).json({error: 'You are not an Admin'});
}





/*** Utility Functions ***/

// This function is used to format express-validator errors as strings
const errorFormatter = ({ location, msg, path, value, nestedErrors }) => {
    return `${location}[${path}]: ${msg}`;
};




/*** Users not authenticated APIs ***/

// POST /api/sessions 
// This route is used for performing login.
app.post('/api/sessions', function(req, res, next) {
    passport.authenticate('local', (err, user, info) => { 
        if (err)
            return next(err);

        if (!user) {
            // display wrong login messages
            return res.status(401).json({ error: info});
        }

        // success, perform the login and extablish a login session
        req.login(user, (err) => {
          if (err)
            return next(err);
          
          return res.json(req.user);
        });
    })(req, res, next);
});

// GET /api/sessions/current
// This route checks whether the user is logged in or not.
app.get('/api/sessions/current', (req, res) => {
    if(req.isAuthenticated()) {
      res.status(200).json(req.user);}
    else
      res.status(401).json({error: 'Not authenticated'});
});
  
// DELETE /api/session/current
// This route is used for loggin out the current user.
app.delete('/api/sessions/current', (req, res) => {
    req.logout(() => {
        res.status(200).json({});
    });
});




// GET /api/publishedPages
// This route is used for retrieving all the published pages with the relative author
app.get('/api/publishedPages',
  (req, res) => {
    cmsDao.listPublishedPages()
      .then(pages => res.json(pages))
      .catch((err) => res.status(500).json(err)); // always return a json and an error message
  }
);

// GET /api/pages/:page_id
// Given a page id, this route returns the associated page from the database
app.get('/api/pages/:page_id',
  [ check('page_id', 'page_id must be a positive integer').isInt({min: 0}) ],    // check: is the id a positive integer?
  async (req, res) => {
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }

    try {
      const result = await cmsDao.getPage(req.params.page_id);
      if (result.error)
        return res.status(404).json(result);
      else{
        // NOTE: "invalid dates" (i.e., missing dates) are set to null during JSON serialization
        return res.json(result);
      }
    } catch (err) {
      res.status(500).end();
    }
  }
);

// GET /api/websiteName
// This route returns the name of the website from the database
app.get('/api/websiteName',
  (req, res) => {
    cmsDao.getWebsiteName()
      .then(name => {
        if (name.error)
          return res.status(404).json(name);

        return res.json(name)
      })
      .catch((err) => res.status(500).json(err)); // always return a json and an error message
  }
);




/*** Regular Users APIs ***/
app.use(isLoggedIn);

// GET /api/allPages
// This route is used for retrieving all the pages with the relative author
app.get('/api/allPages', (req, res) => {
    cmsDao.listAllPages()
      // NOTE: "invalid dates" (i.e., missing dates) are set to null during JSON serialization
      .then(pages => res.json(pages))
      .catch((err) => res.status(500).json(err)); // always return a json and an error message
  }
);

// DELETE /api/pages/:page_id
// Given a page id, this route deletes the associated page from the database.
app.delete('/api/pages/:page_id',
  [ check('page_id', 'page_id must be a positive integer').isInt({min: 0})],
  async (req, res) => {
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }

    try {
      //I need the user_id before. If I took it from a FrontEnd state, an admin could change the author and I have not refreshed the app yet
      const pageToDelete = await cmsDao.getPage(req.params.page_id);
      if (pageToDelete.error)
        return res.status(404).json(pageToDelete); 
      else {
        if (!req.user.admin_role && req.user.user_id !== pageToDelete.user_id)
          return res.status(401).json({error: 'You cannot delete this page'});
        else {
          const result = await cmsDao.deletePage(req.params.page_id);
          return res.status(200).json(result);
        }
      }
    } catch (err) {
      res.status(503).json({ error: `Database error during the deletion of page ${req.params.id}: ${err} ` });
    }
  }
);

// POST /api/pages
// This route adds a new page to the database.
app.post('/api/pages',
  [
    check('title', 'invalid title').trim().notEmpty().isLength({min: 1, max:160}),
    check('publicationDate', 'invalid publication date').isLength({min: 10, max: 10}).isISO8601({strict: true}).optional({checkFalsy: true})
  ],
  async (req, res) => {
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }

    const page = {...req.body, author: req.user.user_id, creationDate: dayjs().format('YYYY-MM-DD')};

    try {
      if (page.publicationDate && dayjs(page.publicationDate).isBefore(dayjs(page.creationDate)))
        return res.status(400).json({error: 'Error during the creation of the page'});

      if(page.blocks.some(block => block.type==='Header') && page.blocks.some(block => (block.type==='Paragraph' || block.type==='Image'))){
        const result = await cmsDao.createPage(page); // NOTE: createPage returns the new created object
        delete result.user_id;
        return res.json(result);
      } else {
        return res.status(400).json({error: 'Error during the creation of the page'});
      }

    } catch (err) {
      res.status(503).json({ error: `Database error during the creation of new page: ${err}` }); 
    }
  }
);

// PUT /api/pages/:page_id
// This route allows to modify a page, specifiying its id and the necessary data.
app.put('/api/pages/:page_id',
  [
    check('page_id', 'page_id must be a positive integer').isInt({min: 0}),
    check('title', 'invalid title').trim().notEmpty().isLength({min: 1, max:160}),
    check('publicationDate', 'invalid publication date').isLength({min: 10, max: 10}).isISO8601({strict: true}).optional({checkFalsy: true}),
    check('authorEmail', 'authorEmail is not a valid email').trim().isEmail()
  ],
  async (req, res) => {
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }

    const editedPage = req.body;

    // Is the id in the body equal to the id in the url?
    if (editedPage.page_id !== Number(req.params.page_id)) {
      return res.status(422).json({ error: 'URL and body id mismatch' });
    }

    try {
      const user = await userDao.getUserIdByEmail(editedPage.authorEmail);
      if (user.error)
        return res.status(404).json(user);
      
      const pageToUpdate = await cmsDao.getPage(req.params.page_id);
      if (pageToUpdate.error)
        return res.status(404).json(pageToUpdate); 
      else {
        if (editedPage.publicationDate && dayjs(editedPage.publicationDate).isBefore(dayjs(pageToUpdate.creation_date)))
          return res.status(400).json({error: 'Error during the updating of the page'});

        if(editedPage.blocks.some(block => block.type==='Header') && editedPage.blocks.some(block => (block.type==='Paragraph' || block.type==='Image'))){
          if ((!req.user.admin_role && req.user.user_id !== pageToUpdate.user_id) || (!req.user.admin_role && pageToUpdate.user_id !== user.user_id))
            return res.status(401).json({error: 'You cannot update this page'});

          const result = await cmsDao.updatePage(user.user_id, editedPage);
          if (result.error)
            return res.status(404).json(result);
          else {
            delete result.user_id;
            return res.json(result);
          }
        } else {
          return res.status(400).json({error: 'Error during the updating of the page'});
        }
      }
    } catch (err) {
      res.status(503).json({ error: `Database error during the update of page ${req.params.page_id}: ${err}` });
    }
  }
);


/*** Admin Users APIs ***/
app.use(isAdmin);

// PUT /api/updateWebsiteName
// This route changes the name of the website
app.put('/api/updateWebsiteName',
  [
    check('newName', 'invalid new name').trim().notEmpty().isLength({min: 1, max:160})
  ],
  async (req, res) => {
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ")  }); // error message is a single string with all error joined together
    }

    try {
      const result = await cmsDao.updateWebsiteName(req.body.newName);
      return res.json(result); 
    } catch (err) {
      res.status(503).json({ error: `Database error updating the name of the website` });
    }
  }
);

// GET /api/users
// This route returns the user emails from the database
app.get('/api/users',
  (req, res) => {
    userDao.getUserEmails()
      .then(users => res.json(users))
      .catch((err) => res.status(500).json(err));
  }
);




app.listen(PORT,
    () => { console.log(`Server started on http://localhost:${PORT}/`) });