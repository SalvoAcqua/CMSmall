'use strict';

/* Data Access Object (DAO) module for accessing users data */

const db = require('./db');
const crypto = require('crypto');


// This function returns user's information given its id.
exports.getUserById = (id) => {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE user_id=?';
      db.get(sql, [id], (err, row) => {
        if (err)
          reject(err);
        else if (row === undefined)
          resolve({ error: 'User not found.' });
        else {
          const user = { user_id: row.user_id, email: row.email, name: row.name, surname: row.surname, admin_role: row.admin_role }
          resolve(user);
        }
      });
    });
};
  
// This function is used at log-in time to verify username and password.
exports.getUser = (email, password) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM users WHERE email=?';
        db.get(sql, [email], (err, row) => {
        if (err) {
            reject(err);
        } else if (row === undefined) {
            resolve(false);
        }
        else {
            const user = { user_id: row.user_id, email: row.email, name: row.name, surname: row.surname, admin_role: row.admin_role }

            crypto.scrypt(password, row.salt, 32, function (err, hashedPassword) {
                if (err) reject(err);
                if (!crypto.timingSafeEqual(Buffer.from(row.password, 'hex'), hashedPassword))
                    resolve(false);
                else
                    resolve(user);
            });
        }
        });
    });
};

// This function retrieves the user_id by the email from the database.
exports.getUserIdByEmail = (email) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT user_id FROM users WHERE email=?';
    db.get(sql, [email], (err, row) => {
      if (err) {
        reject(err);
      }
      if (row == undefined) {
        resolve({ error: 'User not found' });
      } else {
        resolve(row);
      }
    });
  });
};

// This function retrieves the user emails from the database.
exports.getUserEmails = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT user_id, email FROM users';
    db.all(sql, (err, rows) => {
      if (err) {
        reject(err);
      }
      if (rows.length === 0) {
        reject({ error: 'There are no users in the database' });
      } else {
        resolve(rows);
      }
    });
  });
};