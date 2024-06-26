# ToDo-Liste Webanwendung

Diese ToDo-Liste Webanwendung ermöglicht es Benutzern, Aufgaben zu erstellen, zu bearbeiten, zu löschen und ihren Status zu aktualisieren. Die Anwendung verwendet eine lokale SQL-Datenbank zur Speicherung von Benutzerinformationen und Aufgaben.

## Anforderungen

Um diese Anwendung auszuführen, benötigen Sie:

- Node.js installiert auf Ihrem System
- Eine lokale PostgreSQL-Datenbank

## Installation

1. Klonen Sie dieses Repository auf Ihren lokalen Computer.
2. Navigieren Sie in das Hauptverzeichnis des Projekts.
3. Installieren Sie die Abhängigkeiten, indem Sie `npm install` ausführen.
4. Konfigurieren Sie die Umgebungsvariablen, indem Sie eine Datei namens `.env` im Hauptverzeichnis erstellen und die erforderlichen Umgebungsvariablen gemäß `.env.example` festlegen.
5. Starten Sie die Anwendung, indem Sie `npm start` ausführen.

## Verwendung

1. Öffnen Sie Ihren Webbrowser und navigieren Sie zur Adresse `http://localhost:3000`.
2. Registrieren Sie sich mit einem neuen Benutzernamen und Passwort oder melden Sie sich mit einem vorhandenen Konto an.
3. Erstellen Sie neue Listen und fügen Sie Aufgaben hinzu.
4. Aktualisieren Sie den Status von Aufgaben, indem Sie die Checkboxen aktivieren/deaktivieren.
5. Löschen Sie Aufgaben oder ganze Listen bei Bedarf.

## Backend

Das Backend der Anwendung ist in Node.js mit dem Express-Framework geschrieben. Es verwendet eine PostgreSQL-Datenbank zur Speicherung von Benutzerinformationen und Aufgaben. Die Datenbankverbindung und -operationen werden mithilfe des `pg`-Pakets ausgeführt.

## Frontend

Das Frontend der Anwendung besteht aus HTML, CSS und JavaScript. Es ermöglicht Benutzern die Interaktion mit der Webanwendung über einen Webbrowser. Die Benutzeroberfläche ist einfach und intuitiv gestaltet, um eine nahtlose Benutzererfahrung zu bieten.

## Technologien

- Node.js
- Express.js
- PostgreSQL
- HTML
- CSS
- JavaScript

## Autoren

Diese Anwendung wurde von Ashkan Pahlavan (ich 😊 ) entwickelt.


