import dayjs from 'dayjs';

const SERVER_URL = 'http://localhost:3000/api/';

/**
 * A utility function for parsing the HTTP response.
 */
function getJson(httpResponsePromise) {
  // server API always return JSON, in case of error the format is the following { error: <message> }
  return new Promise((resolve, reject) => {
    httpResponsePromise
      .then((response) => {

        if (response.ok) {
         // the server always returns a JSON, even empty {}. Never null or non json, otherwise the method will fail
         response.json()
            .then( json => resolve(json) )
            .catch( err => reject({ error: "Cannot parse server response" }))
        } else {
          // analyzing the cause of error
          response.json()
            .then(obj => 
              reject(obj)
              ) // error msg in the response body
            .catch(err => reject({ error: "Cannot parse server response" }))
        }

      })
      .catch(err => 
        reject({ error: "Cannot communicate"  })
      ) // connection error
  });
}




/*** Users not authenticated APIs ***/

/**
 * This function wants username and password inside a "credentials" object.
 * It executes the log-in.
 */
const logIn = async (credentials) => {
    return getJson(fetch(SERVER_URL + 'sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(credentials),
    }))
};

/**
 * This function is used to verify if the user is still logged-in.
 * It returns a JSON object with the user info.
 */
const getUserInfo = async () => {
    return getJson(fetch(SERVER_URL + 'sessions/current', {
      credentials: 'include'
    }))
};

/**
 * This function destroy the current user's session and execute the log-out.
 */
const logOut = async() => {
    return getJson(fetch(SERVER_URL + 'sessions/current', {
      method: 'DELETE',
      credentials: 'include'
    }))
};

/**
 * Getting and returing the name of the website.
 */
const getWebsiteName = async () => {
  return getJson(fetch(SERVER_URL + 'websiteName', {
    credentials: 'include'
  })).then (json => json.name)
};

/**
 * This function retrieves all the published pages with the relative author
 */
const getPublishedPages = async () => {
  return getJson(fetch(SERVER_URL + 'publishedPages', { credentials: 'include' })
  ).then( json => {
    return json.map((page) => {
      const clientPage = {
        page_id: page.page_id,
        title: page.title,
        user_id: page.user_id,
        authorName: page.name,
        authorSurname: page.surname,
        creationDate: dayjs(page.creation_date),
        publicationDate: dayjs(page.publication_date)
      }

      return clientPage;
    })
  })
};

/**
 * Getting and returing a page, specifying its page_id.
 */
const getPageById = async (page_id) => {
  return getJson( fetch(SERVER_URL + 'pages/' + page_id, { credentials: 'include' }))
    .then( page => {
      const clientPage = {
        page_id: page.page_id,
        title: page.title,
        user_id: page.user_id,
        authorEmail: page.email,
        authorName: page.name,
        authorSurname: page.surname,
        creationDate: dayjs(page.creation_date),
        publicationDate: page.publication_date ? dayjs(page.publication_date) : '',
        blocks: page.blocks
      }
      return clientPage;
    } )
};


/*** Logged Users APIs ***/

/**
 * This function retrieves all the pages with the relative author
 */
const getAllPages = async () => {
  
  return getJson(fetch(SERVER_URL + 'allPages', { credentials: 'include' })
  ).then( json => {
    return json.map((page) => {
      const clientPage = {
        page_id: page.page_id,
        title: page.title,
        user_id: page.user_id,
        authorName: page.name,
        authorSurname: page.surname,
        creationDate: dayjs(page.creation_date),
        publicationDate: page.publication_date ? dayjs(page.publication_date) : null
      }

      return clientPage;
    })
  })
};


/**
 * This function deletes a page from the database
 */
function deletePage(page_id) {
  return getJson(
    fetch(SERVER_URL + "pages/" + page_id, {
      method: 'DELETE',
      credentials: 'include'
    })
  )
};

/**
 * This funciton adds a new page in the database.
 */
function addPage(page) {
  return getJson(
    fetch(SERVER_URL + "pages/", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(page) 
    })
  )
};

/**
 * This function updates a page in the database. It wants a page object as parameter and verify whether the page_id exists.
 */
function updatePage(page) {
  /*if (film && film.watchDate && (film.watchDate instanceof dayjs))
      film.watchDate = film.watchDate.format("YYYY-MM-DD");*/
  return getJson(
    fetch(SERVER_URL + "pages/" + page.page_id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(page)
    })
  )
}


/*** Only Admin Users APIs ***/

/**
 * This function updates the title of the website
 */
function updateWebsiteName(newName) {
  return getJson(
    fetch(SERVER_URL + "updateWebsiteName", {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({newName: newName})
    })
  )
};

/**
 * This function retrieves all the user emails
 */
function getUserEmails() {
  return getJson(fetch(SERVER_URL + 'users', { credentials: 'include' })
  )
};




const API = { logIn, getUserInfo, logOut, getWebsiteName, updateWebsiteName, getPublishedPages, getAllPages, getPageById, deletePage, addPage, updatePage, getUserEmails };
export default API;