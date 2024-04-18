
document.addEventListener('DOMContentLoaded', function() {
    const userName = localStorage.getItem('UserName');
    const userIdInput = document.getElementById('userIdInput');
    userIdInput.value = userName;
    userIdInput.disabled = true;
    // await aufgabenLaden();
    // aufgabenLaden(userName);
    const taskInput = document.getElementById('taskInput');
    taskInput.addEventListener('keydown', function(event) {
        // Überprüfen, ob die gedrückte Taste die Eingabetaste ist (keyCode 13)
        if (event.keyCode === 13) {
            aufgabeHinzufuegen();
        }
    });

});
async function aufgabenLaden() {
    try {
        const listName = document.getElementById('listNameInput').value;
        const userName = document.getElementById('userIdInput').value;
        
        const response = await fetch(`http://localhost:3000/tasks?listName=${listName}&UserName=${userName}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const aufgabenListe = document.getElementById('todoListe');
        aufgabenListe.innerHTML = ''; // Leert die aktuelle Liste, um sie neu zu befüllen

        if (data.length > 0) {
            data.forEach(task => {
                const li = document.createElement('li');
                li.id = `task_${task.id}`;

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.classList.add('checkbox-custom');
                checkbox.id = `checkbox_${task.id}`;

                const label = document.createElement('label');
                label.htmlFor = checkbox.id;
                label.textContent = `✔️ ${task.task}`;
                label.classList.add('checkbox-label');

                if (task.checked) {
                    label.classList.add('task-checked');
                    checkbox.checked = true; 
                }

                checkbox.addEventListener('change', async function() {
                    try {
                        // Task-ID abrufen
                        const taskId = task.id;
                
                        // Aktuellen Zustand der Checkbox abrufen
                        const isChecked = this.checked;
                
                        // Den neuen Zustand der Checkbox invertieren
                        const newChecked = !isChecked;
                
                        // Task-Status aktualisieren und zum Server senden

                        await updateTaskStatus(taskId, newChecked);
                
                        // Wenn die Checkbox aktiviert ist, füge den Stil für erledigte Aufgaben hinzu
                        if (isChecked) {
                            label.classList.add('task-checked');
                            checkbox.classList.add('checked');
                        } else {
                            // Andernfalls entferne den Stil für erledigte Aufgaben
                            label.classList.remove('task-checked');
                            checkbox.classL-ist.add('checked');
                        }
                
                        // Aktualisieren Sie die Aufgabenliste nach dem Aktualisieren einer Aufgabe
                        // await aufgabenLaden();
                    } catch (error) {
                        console.error('Fehler beim Aktualisieren der Aufgabe:', error);
                    }
                });
                

                li.appendChild(checkbox);
                li.appendChild(label);

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Löschen';
                deleteButton.onclick = function () {
                    aufgabeLoeschen(listName, task.id);
                };
                li.appendChild(deleteButton);

                aufgabenListe.appendChild(li);
            });
            showTableNames();
        } else {
            alert('Es wurden keine Aufgaben gefunden.');
        }
    } catch (error) {
        console.error('Fehler beim Laden der Aufgaben:', error);
    }
}

async function aufgabeLoeschen(listName, taskId) {
    try {
        const userName = document.getElementById('userIdInput').value;
        const confirmed = confirm('Sind Sie sicher, dass Sie diese Task löschen möchten?');

        if (!confirmed) {
            return; // Wenn der Benutzer die Aktion abbricht, wird die Funktion hier beendet
        }
        const response = await fetch(`http://localhost:3000/deleteTask`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ UserName: userName , listName : listName, TaskId: taskId })
        });
        // console.log(response);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Task erfolgreich gelöscht, aktualisiere die Anzeige oder führe andere notwendige Aktionen aus
        console.log("Task erfolgreich gelöscht");

        // Aktualisiere die Aufgabenliste nach dem Löschen einer Aufgabe
        await aufgabenLaden();
    } catch (error) {
        console.error("Fehler beim Löschen des Tasks:", error);
    }
}
async function showTableNames() {
    try {
      const userName = document.getElementById('userIdInput').value;
  
      const response = await fetch(`http://localhost:3000/tableNames?UserName=${userName}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const tableNames = await response.json();
      const tableList = document.getElementById('tableList');
      tableList.innerHTML = ''; // Leert die aktuelle Liste, um sie neu zu befüllen
  
      tableNames.forEach(tableName => {
        const li = document.createElement('li');
        li.textContent = tableName;

        // Create delete button for each table name
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '❌';
        deleteButton.onclick = function () {
            deleteTable(tableName);
        };
        li.appendChild(deleteButton);

        li.addEventListener('click', function() {
            document.getElementById('listNameInput').value = tableName;
            aufgabenLaden();
        });

        tableList.appendChild(li);
    });
    
    } catch (error) {
      console.error('Fehler beim Laden der Tabellennamen:', error);
    }
}

async function deleteTable(tableName) {
    try {
        const userName = document.getElementById('userIdInput').value;
        const confirmed = confirm('Sind Sie sicher, dass Sie diese Liste löschen möchten?');
        if (!confirmed) {
            return; // Wenn der Benutzer die Aktion abbricht, wird die Funktion hier beendet
        }
        const response = await fetch(`http://localhost:3000/deleteTable?TableName=${tableName}&UserName=${userName}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Table successfully deleted
        console.log(`Table ${tableName} successfully deleted`);

        // Refresh table names
        await showTableNames();
    } catch (error) {
        console.error("Fehler beim Löschen der Tabelle:", error);
    }
}

async function aufgabeHinzufuegen() {
    try {
        const userId = document.getElementById('userIdInput').value;
        const listName = document.getElementById('listNameInput').value;
        const taskDescription = document.getElementById('taskInput').value;

        if (listName === '' || taskDescription === '') {
            alert('Bitte Listname und eine Task eingeben!');
            return;
        }

        const requestBody = {
            listName,
            task: taskDescription,
            UserName: userId
        };

        const response = await fetch('http://localhost:3000/task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Added record:', data);
        document.getElementById('taskInput').value = '';
        aufgabenLaden();
    } catch (error) {
        console.error('Error adding record:', error.message);
    }
}

async function updateTaskStatus(taskId, checked) {
    const userName = document.getElementById('userIdInput').value;
    const listName = document.getElementById('listNameInput').value;
    try {
        const response = await fetch(`http://localhost:3000/updateTaskStatus`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ UserName: userName, listName: listName, TaskId: taskId, Checked: checked })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Aufgabe:', error);
    }
}


