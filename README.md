# Kanblendar

[![Support Private.coffee!](https://shields.private.coffee/badge/private.coffee-support%20us!-pink?logo=coffeescript)](https://private.coffee)

Kanblendar is a JavaScript class that blends the functionality of a Kanban board and a daily calendar. Users can create, edit, and organize tasks within columns and time slots, and receive notifications for upcoming tasks.

## Features

- Plain JavaScript class with no dependencies
- Create, edit, and delete tasks
- Organize tasks into columns and time slots
- Drag and drop tasks between columns and time slots
- Set due times and receive notifications
- Visual feedback during drag-and-drop operations

## Installation

1. Clone the repository:
    ```sh
    git clone https://git.private.coffee/kumi/kanblendar.git
    ```

2. Navigate to the project directory:
    ```sh
    cd kanblendar
    ```

3. Open `example.html` in your web browser to start the example application.

## Usage

### Creating a Task

1. Click the "Create Task" button.
2. Fill out the task form with the title, description, due time, column, and notification time.
3. Click "Save" to create the task.

### Editing a Task

1. Click on an existing task to open the edit form.
2. Update the task details as needed.
3. Click "Save" to save the changes.

### Deleting a Task

1. Click on an existing task to open the edit form.
2. Click the "Delete" button to remove the task.

### Drag and Drop

- Drag tasks between columns or into specific time slots.
- Tasks will update their due time if moved into a time slot where the current due time is not valid.

## Notifications

- Kanblendar requests notification permissions on load.
- Notifications are shown for tasks based on the specified notification time.
- Notifications are automatically unscheduled if a task is modified or deleted.
- If notifications are not supported or denied, a alert will be shown instead.

## Programmatically Modifying the Kanblendar

You can programmatically create, edit, and delete tasks using JavaScript. Here are some examples:

### Creating a Task

```javascript
const kanblendar = new Kanblendar();

const title = 'New Task';
const description = 'This is a new task.';
const dueTime = '2023-10-31T14:00';
const column = 'backlog';
const notifyBefore = 10; // Notify 10 minutes before the due time

const newTask = kanblendar.createTaskElement(title, description, dueTime, column, notifyBefore);
kanblendar.moveTaskToColumn(newTask, column);
kanblendar.updateTaskLocation(newTask, dueTime);
kanblendar.scheduleNotification(title, description, new Date(dueTime), notifyBefore, newTask.id);
```

### Editing a Task

```javascript
const taskId = 'task-1234567890'; // Replace with the actual task ID
const task = document.getElementById(taskId);

const newTitle = 'Updated Task';
const newDescription = 'This is an updated task.';
const newDueTime = '2023-10-31T15:00';
const newColumn = 'in-progress';
const newNotifyBefore = 15; // Notify 15 minutes before the due time

task.querySelector('.kanblendar-task-title').innerText = newTitle;
task.querySelector('.kanblendar-task-desc').innerText = newDescription;
task.dataset.dueTime = newDueTime;
task.dataset.column = newColumn;
task.dataset.notifyBefore = newNotifyBefore;

kanblendar.moveTaskToColumn(task, newColumn);
kanblendar.updateTaskLocation(task, newDueTime);
kanblendar.cancelNotification(task.id);
kanblendar.scheduleNotification(newTitle, newDescription, new Date(newDueTime), newNotifyBefore, task.id);
```

### Deleting a Task

```javascript
const taskId = 'task-1234567890'; // Replace with the actual task ID
const task = document.getElementById(taskId);

kanblendar.deleteTask(task);
```

## Development

### Project Structure

- `kanblendar.css` - CSS styles
- `kanblendar.js` - JavaScript functionality
- `example.html` - Example HTML file
- `example.js` - Additional JavaScript code for the example
- `example.css` - Additional CSS styles for the example

### Adding Features

1. Clone the repository and create a new branch:
    ```sh
    git checkout -b feature-branch
    ```

2. Make your changes and commit them:
    ```sh
    git commit -m "Add new feature"
    ```

3. Push the changes to the remote repository:
    ```sh
    git push origin feature-branch
    ```

4. Open a pull request to the main branch.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.