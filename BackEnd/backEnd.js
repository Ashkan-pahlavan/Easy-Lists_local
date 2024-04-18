const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const env = require("dotenv");
const { Client } = require("pg");

env.config();

const server = express();
const PORT = 3000;

server.use(express.json());
server.use(cors());

const dbLogin = new Client({
  user: process.env.DB_USER,
  database: "TodoList",
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || "5432",
  host: process.env.DB_HOST || "localhost"
});

dbLogin.connect()
  .then(() => console.log("Login-Datenbank verbunden"))
  .catch(err => console.error("Fehler beim Verbinden mit der Login-Datenbank", err));


server.post("/login", async (req, res) => {
  try {
    const { UserName, Password } = req.body;

    if (!UserName || !Password) {
      return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
    }
    // Benutzer in der Datenbank suchen
    const user = await dbLogin.query("SELECT * FROM login WHERE UserName = $1", [UserName]);

    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Benutzer nicht gefunden' });
    }

    // Das Passwort aus der Datenbank abrufen
    const retrievedHashedPassword = user.rows[0].password;

    // Das eingegebene Passwort mit dem aus der Datenbank abgerufenen Passwort vergleichen
    const passwordMatch = await bcrypt.compare(Password, retrievedHashedPassword);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Ungültige Anmeldeinformationen' });
    }
    const userDB = new Client({
      user: process.env.DB_USER,
      database: UserName,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || "5432",
      host: process.env.DB_HOST || "localhost"
    });

    await userDB.connect()
    .then(() => console.log(`Login-Datenbank "${UserName}" verbunde`))
    .catch(err => console.error("Fehler beim Verbinden mit der Login-Datenbank", err));

    // Token erstellen und senden
    const token = jwt.sign({ UserName: user.rows[0].UserName }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Anmeldung erfolgreich', token });
    await userDB.end();
  } catch (error) {
    console.error('Fehler bei der Anmeldung:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

server.post("/register", async (req, res) => {
  try {
    const { UserName, Password } = req.body;

    if (!UserName || !Password) {
      return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
    }

    // Überprüfen, ob der Benutzername bereits existiert
    const existingUser = await dbLogin.query("SELECT * FROM login WHERE UserName = $1", [UserName]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Benutzername bereits vergeben' });
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(Password, 10);

    // ******************** console.log(hashedPassword)

    // Benutzer in die Datenbank einfügen
    await dbLogin.query("INSERT INTO login (UserName, Password) VALUES ($1, $2)", [UserName, hashedPassword]);

    // Erstellen Sie eine neue Datenbank für den Benutzer
    await dbLogin.query(`CREATE DATABASE "${UserName}"`);
    

    // Verbinden Sie sich mit der neuen Datenbank des Benutzers
    const userDB = new Client({
      user: process.env.DB_USER,
      database: UserName,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || "5432",
      host: process.env.DB_HOST || "localhost"
    });

    await userDB.connect()
    .then(() => console.log(`Login-Datenbank "${UserName}" verbunde`))
    .catch(err => console.error("Fehler beim Verbinden mit der Login-Datenbank", err));
    // Erstellen Sie die benötigten Tabellen in der Datenbank des Benutzers
    // await userDB.query(`
    //   CREATE TABLE IF NOT EXISTS tasks (
    //     id SERIAL PRIMARY KEY,
    //     task TEXT
    //   )
    // `);

    res.status(201).json({ message: 'Registrierung erfolgreich' });
    await userDB.end();
  } catch (error) {
    console.error('Fehler bei der Registrierung:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
server.get("/tasks", async (req, res) => {
  try {
    const { UserName, listName } = req.query;

    // Überprüfen, ob UserName und listName vorhanden sind
    if (!UserName) {
      return res.status(400).json({ error: 'UserName erforderlich' });
    }
    if (!listName) {
      return res.status(400).json({ error: 'ListName erforderlich' });
    }

    // Neue Verbindung zur Benutzerdatenbank herstellen
    const userDB = new Client({
      user: process.env.DB_USER,
      database: UserName,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || "5432",
      host: process.env.DB_HOST || "localhost"
    });

    await userDB.connect(); // Verbindung zur Datenbank herstellen

    // Abfrage zum Abrufen der Aufgaben für den angegebenen listName
    const getTasksQuery = `
      SELECT * FROM "${listName}"
      ORDER BY CASE 
        WHEN checked IS FALSE OR checked IS NULL THEN 0
        WHEN checked IS TRUE THEN 1
      END
    `;
    const tasksResult = await userDB.query(getTasksQuery);
    
    // Antwort senden
    res.status(200).json(tasksResult.rows);
    await userDB.end(); // Verbindung schließen
  } catch (error) {
    console.error('Fehler beim Laden der Aufgaben:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


server.post("/task", async (req, res) => {
  try {
    const { listName, task, UserName } = req.body;
    //**************************** */ console.log(req.body);

    if (!listName || !task || !UserName) {
      return res.status(400).json({ error: 'ListName, Task und UserName erforderlich' });
    }
    
    const userDB = new Client({
      user: process.env.DB_USER,
      database: UserName, // Verwendete Benutzername als Datenbankname
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || "5432",
      host: process.env.DB_HOST || "localhost"
    });

    await userDB.connect(); // Verbindung zur Datenbank herstellen

    // Überprüfen, ob die angegebene Tabelle existiert, falls nicht, erstellen
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS "${listName}" (
        id SERIAL PRIMARY KEY,
        task TEXT,
        checked BOOLEAN DEFAULT false
      )
    `;
  
    await userDB.query(createTableQuery);

    // Task in die angegebene Tabelle einfügen
    const insertTaskQuery = `INSERT INTO "${listName}" (task) VALUES ($1) RETURNING *`;
    const values = [task];
    const result = await userDB.query(insertTaskQuery, values);

    // Alle Tasks aus der Tabelle abrufen
    const getTasksQuery = `SELECT * FROM "${listName}"
    `;
    const tasksResult = await userDB.query(getTasksQuery);
    const response = tasksResult.rows

    // console.log(response);

    res.status(201).json({ message: 'Aufgabe hinzugefügt', tasks: tasksResult.rows });
    await userDB.end();
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Aufgabe:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


async function getTasksAndSendResponse(req, res) {
  try {
    const { UserName, listName } = req.query;

    // Überprüfen, ob UserName und listName vorhanden sind
    if (!UserName) {
      return res.status(400).json({ error: 'UserName erforderlich' });
    }
    if (!listName) {
      return res.status(400).json({ error: 'ListName erforderlich' });
    }
    // console.log(UserName);
    // console.log(listName);

    // Neue Verbindung zur Benutzerdatenbank herstellen
    const userDB = new Client({
      user: process.env.DB_USER,
      database: UserName,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || "5432",
      host: process.env.DB_HOST || "localhost"
    });

    await userDB.connect(); // Verbindung zur Datenbank herstellen

    // Abfrage zum Abrufen der Aufgaben für den angegebenen listName
    const getTasksQuery = `SELECT * FROM "${listName}"`;
    const tasksResult = await userDB.query(getTasksQuery);
    
    // const response = tasksResult.rows
    // console.log(response);

    // Antwort senden
    res.status(200).json(tasksResult.rows);
    await userDB.end();
  } catch (error) {
    console.error('Fehler beim Laden der Aufgaben:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
server.get("/tasks", getTasksAndSendResponse);

server.post("/deleteTask", async (req, res) => {
  try {
    const { UserName, listName, TaskId } = req.body;

    // console.log(req.body);

    if (!listName || !TaskId) {
      return res.status(400).json({ error: 'UserName und TaskId erforderlich' });
    }

    // Logik zum Löschen der Aufgabe
    await deleteTask(UserName, listName, TaskId);

    res.status(200).json({ message: 'Aufgabe erfolgreich gelöscht' });

  } catch (error) {
    console.error('Fehler beim Löschen der Aufgabe:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


async function deleteTask(UserName, listName, taskId) {
  try {
    const userDB = new Client({
      user: process.env.DB_USER,
      database: UserName,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || "5432",
      host: process.env.DB_HOST || "localhost"
    });

    await userDB.connect();
    const query = `DELETE FROM "${listName}" WHERE id = $1`;
    const values = [taskId];
    await userDB.query(query, values);
    await userDB.end();
    return { message: 'Aufgabe gelöscht' };
  } catch (error) {
    console.error('Fehler beim Löschen der Aufgabe:', error);
    throw error;
  }
}

server.delete("/deleteTable", async (req, res) => {
  try {
    const { UserName, TableName } = req.query;

    if (!UserName || !TableName) {
      return res.status(400).json({ error: 'UserName und TableName erforderlich' });
    }

    // Logik zum Löschen der Tabelle
    await deleteTable(UserName, TableName);

    res.status(200).json({ message: 'Tabelle erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen der Tabelle:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

async function deleteTable(UserName, TableName) {
  try {
    const userDB = new Client({
      user: process.env.DB_USER,
      database: UserName,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || "5432",
      host: process.env.DB_HOST || "localhost"
    });

    await userDB.connect();
    const query = `DROP TABLE IF EXISTS "${TableName}"`;
    await userDB.query(query);
    await userDB.end();
    return { message: 'Tabelle gelöscht' };
  } catch (error) {
    console.error('Fehler beim Löschen der Tabelle:', error);
    throw error;
  }
}


server.get("/tableNames", async (req, res) => {
  try {
    const { UserName } = req.query;
    if (!UserName) {
      return res.status(400).json({ error: 'UserName erforderlich' });
    }

    const userDB = new Client({
      user: process.env.DB_USER,
      database: UserName,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || "5432",
      host: process.env.DB_HOST || "localhost"
    });

    await userDB.connect();

    const tables = await userDB.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'");

    const tableNames = tables.rows.map(row => row.table_name);

    res.status(200).json(tableNames);
    await userDB.end();
  } catch (error) {
    console.error('Fehler beim Laden der Tabellennamen:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


server.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});


//////////////////////////////////

server.post("/updateTaskStatus", async (req, res) => {
  try {
    // console.log(req.body);
    // console.log(res);
      const { UserName, listName,TaskId, Checked } = req.body;

      if (!UserName || !listName || !TaskId || Checked === undefined) {
          return res.status(400).json({ error: 'UserName, listName, TaskId und Checked erforderlich' });
      }

      // Logik zum Aktualisieren des Aufgabenstatus
      await updateTaskStatus(UserName, listName,TaskId, Checked);

      res.status(200).json({ message: 'Aufgabenstatus erfolgreich aktualisiert' });
  } catch (error) {
      console.error('Fehler beim Aktualisieren des Aufgabenstatus:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});



async function updateTaskStatus(UserName, listName, TaskId, Checked) {
  const userDB = new Client({
      user: process.env.DB_USER,
      database: UserName,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || "5432",
      host: process.env.DB_HOST || "localhost"
  });

  await userDB.connect();
  
  // Holen Sie den aktuellen Status der Aufgabe aus der Datenbank
  const getCurrentStatusQuery = `SELECT checked FROM "${listName}" WHERE id = $1`;
  const currentStatusResult = await userDB.query(getCurrentStatusQuery, [TaskId]);
  const currentStatus = currentStatusResult.rows[0].checked;

  // Invertieren Sie den aktuellen Status, um den neuen Status zu erhalten
  const newChecked = !currentStatus;

  // Aktualisieren Sie den Status in der Datenbank
  const updateQuery = `UPDATE "${listName}" SET checked = $1 WHERE id = $2`;
  const values = [newChecked, TaskId];
  await userDB.query(updateQuery, values);
}
