'use strict';

/* Data Access Object (DAO) module for accessing films data */

const db = require('./db');
const dayjs = require("dayjs");

// This function retrieves the name of the website from the database.
exports.getWebsiteName = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM website';
    db.get(sql, (err, row) => {
      if (err) {
        reject(err);
      }
      if (row == undefined) {
        resolve({ error: 'The name of the website is not found' });
      } else {
        resolve(row);
      }
    });
  });
};

// This function updates the name of the website.
exports.updateWebsiteName = (newName) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE website SET name=?';
    db.run(sql, [newName], function (err) {
      if (err) {
        reject(err);
      }
      
      resolve(exports.getWebsiteName());
    });
  });
};

// This function retrieves the pages from the database that are published.
exports.listPublishedPages = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT P.page_id, P.title, U.user_id, U.name, U.surname, P.creation_date, P.publication_date FROM pages P, users U WHERE P.author = U.user_id AND P.publication_date<=?';
    db.all(sql, [dayjs().format('YYYY-MM-DD')], (err, rows) => {
      if (err) { reject(err); }
      
      resolve(rows);
    });
  });
};

// This function retrieves all the pages from the database.
exports.listAllPages = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT P.page_id, P.title, U.user_id, U.name, U.surname, P.creation_date, P.publication_date FROM pages P, users U WHERE P.author = U.user_id';
    db.all(sql, (err, rows) => {
      if (err) { reject(err); }
      
      resolve(rows);
    });
  });
};

// This function retrieves a page given its id from the database with all its blocks.
exports.getPage = (page_id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT P.page_id, P.title, U.user_id, U.email, U.name, U.surname, P.creation_date, P.publication_date, B.block_id, B.type, B.content, B.position FROM users U, pages P, blocks B WHERE P.author = U.user_id AND P.page_id = B.page_id AND P.page_id=?';
    db.all(sql, [page_id], (err, rows) => {
      if (err) {
        reject(err);
      }
      if (rows.length===0) {
        resolve({ error: 'Page not found.' });
      } else {
        resolve({page_id: rows[0].page_id,
          title: rows[0].title,
          user_id: rows[0].user_id,
          email: rows[0].email,
          name: rows[0].name,
          surname: rows[0].surname,
          creation_date: rows[0].creation_date,
          publication_date: rows[0].publication_date,
          blocks: rows.map(b => {return {block_id: b.block_id, type: b.type, content: b.content, position: b.position}})
        });
      }
    });
  });
};

// This function deletes an existing page given its id.
exports.deletePage = (page_id) => {
  return new Promise((resolve, reject) => {
    const sql1 = 'DELETE FROM blocks WHERE page_id = ?';
    db.run(sql1, [page_id], (err, row) => {
      if (err)
        reject(err);

      if (this.changes === 0)
        reject({ error: 'No blocks found.' });
      else {
        const sql2 = 'DELETE FROM pages WHERE page_id=?';
        db.run(sql2, [page_id], function (err) {
          if (err)
            reject(err);

          resolve({});
        });
      }
    })
  });
}

/**
 * This function adds a new page in the database.
 * The page id and each block id is added automatically by the DB, and it is returned as this.lastID.
 */
exports.createPage= (page) => {
  if (page.publicationDate == "")
    page.publicationDate = null;

  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO pages (title, author, creation_date, publication_date) VALUES(?, ?, ?, ?)';
    db.run(sql, [page.title, page.author, page.creationDate, page.publicationDate], async function (err) {
      if (err) {
        reject(err);
      }

      const sql2 = 'INSERT INTO blocks (type, content, position, page_id) VALUES (?, ?, ?, ?)';

      for (const row of page.blocks) {
        await db.run(sql2, [row.type, row.content, row.position, this.lastID], function (err) {
          if (err) {
            reject(err);
          }
        });
      }

      resolve(exports.getPage(this.lastID));
    });
  });
};

/**
 * This function updates a page in the database.
 */
exports.updatePage= (user_id, editedPage) => {
  if (editedPage.publicationDate == "")
    editedPage.publicationDate = null;

  return new Promise((resolve, reject) => {
    const sql1 = 'UPDATE pages SET title=?, author=?, publication_date=? WHERE page_id=?';
    db.run(sql1, [editedPage.title, user_id, editedPage.publicationDate, editedPage.page_id], function (err) {
      if (err) {
        reject(err);
      }

      if (this.changes !== 1) {
        resolve({ error: 'No page was updated.' });
      } else {

        const sql2 = 'DELETE FROM blocks WHERE page_id = ?';
        db.run(sql2, [editedPage.page_id], async function (err) {
          if (err) {
            reject(err);
          }
          
          if (this.changes < 1){
            resolve({ error: 'No blocks was updated.' });
          } else {
            const sql3 = 'INSERT INTO blocks (type, content, position, page_id) VALUES (?, ?, ?, ?)';

            for (const row of editedPage.blocks) {
              await db.run(sql3, [row.type, row.content, row.position, editedPage.page_id], function (err) {
                if (err) {
                  reject(err);
                }
              });
            }

            resolve(exports.getPage(editedPage.page_id));
          }
        });

      }
    });
  });
};