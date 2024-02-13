const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())

const dbpath = path.join(__dirname, 'userData.db')

let db = null

const initilazeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initilazeDbAndServer()

app.post('/register/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(request.body.password, 10)
  const selectRegisterQuery = `
    SELECT 
        *
    FROM
        user
    WHERE 
        username = '${username}';
    `
  const dbUser = await db.get(selectRegisterQuery)

  if (dbUser === undefined) {
    // Create New User
    const createUserQuery = `
        INSERT INTO 
            user (username, name, password, gender, location)
        VALUES ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}' ); `
    if (password.length >= 5) {
      await db.run(createUserQuery)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectRegisterQuery = `
    SELECT 
        *
    FROM
        user
    WHERE 
        username = '${username}';
    `
  const dbUser = await db.get(selectRegisterQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatch === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

// passowrd change

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectRegisterQuery = `
    SELECT 
        *
    FROM
        user
    WHERE 
        username = '${username}';
    `
  const dbUser = await db.get(selectRegisterQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatch = await bcrypt.compare(oldPassword, dbUser.password)
    if (isPasswordMatch === true) {
      if (newPassword.length >= 5) {
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        const updateQuery = `
        UPDATE
          user
        SET password = '${hashedPassword}'
        WHERE username = '${username}';
        `
        await db.run(updateQuery)
        response.status(200)
        response.send('Password updated')
      } else {
        response.status(400)
        response.send('Password is too short')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app;
