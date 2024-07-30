class Kanblendar {
    constructor(config = {}) {
        this.kanbanSection = document.getElementById('kanblendar');
        this.tasks = new Map();
        this.notificationTimeouts = new Map();
        this.currentTask = null;

        // Read configuration from data attributes
        const dataConfig = {
            columns: this.kanbanSection.dataset.columns ? this.kanbanSection.dataset.columns.split(',') : undefined,
            startTime: this.kanbanSection.dataset.startTime,
            endTime: this.kanbanSection.dataset.endTime,
            interval: this.kanbanSection.dataset.interval ? parseInt(this.kanbanSection.dataset.interval, 10) : undefined
        };

        // Default configuration options
        const defaultConfig = {
            columns: ['Backlog', 'In Progress', 'Done'],
            timeSlots: null,
            startTime: '08:00',
            endTime: '18:00',
            interval: 60, // in minutes
            generateModal: true, // Option to generate modal or not
            currentDate: new Date().toISOString().split('T')[0] // Default to today's date
        };

        // Merge configurations
        this.config = { ...defaultConfig, ...config, ...dataConfig };
        this.timeSlots = this.config.timeSlots || this.generateTimeSlots(this.config.startTime, this.config.endTime, this.config.interval);
        this.columns = this.config.columns;

        this.init();
    }

    init() {
        this.kanbanSection = document.getElementById('kanblendar');

        if (this.config.generateModal) {
            this.createModal();
        } else {
            this.taskModal = document.getElementById('kanblendar-taskModal');
            this.closeModal = document.querySelector('.kanblendar-close');
            this.taskForm = document.getElementById('kanblendar-taskForm');
        }

        this.closeModal.addEventListener('click', () => this.closeModalFunc());
        window.addEventListener('click', (event) => {
            if (event.target === this.taskModal) {
                this.closeModalFunc();
            }
        });
        this.taskForm.addEventListener('submit', (event) => this.saveTask(event));

        document.addEventListener('taskMoved', (e) => {
            console.log(`Task ${e.detail.taskId} moved to ${e.detail.newParent}`);
            this.adjustTimeSlotHeights();
        });

        this.generateKanbanColumns(); // Generate the kanban columns
        this.initDragAndDrop(); // Initialize drag and drop functionality
        this.requestNotificationPermission(); // Request permission for notifications
        this.highlightCurrentTimeSlot(); // Highlight the current time slot
        setInterval(() => this.highlightCurrentTimeSlot(), 60000); // Update highlight every minute
    }

    highlightCurrentTimeSlot() {
        const now = new Date();
        const currentTime = `${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`;

        document.querySelectorAll('.kanblendar-time-slot').forEach(slot => {
            const startTime = slot.dataset.startTime;
            const endTime = this.addMinutes(this.parseTime(startTime), this.config.interval).toTimeString().slice(0, 5);

            if (currentTime >= startTime && currentTime < endTime) {
                slot.classList.add('kanblendar-current-time');
            } else {
                slot.classList.remove('kanblendar-current-time');
            }
        });
    }

    createModal() {
        const modalHTML = `
            <div id="kanblendar-taskModal" class="kanblendar-modal">
                <div class="kanblendar-modal-content">
                    <span class="kanblendar-close">&times;</span>
                    <h2 id="kanblendar-modalTitle">Create Task</h2>
                    <form id="kanblendar-taskForm">
                        <label for="kanblendar-taskTitle">Title:</label>
                        <input type="text" id="kanblendar-taskTitle" name="kanblendar-taskTitle" required>
                        <label for="kanblendar-taskDescription">Description:</label>
                        <textarea id="kanblendar-taskDescription" name="kanblendar-taskDescription" required></textarea>
                        <label for="kanblendar-taskDueTime">Due Time:</label>
                        <input type="datetime-local" id="kanblendar-taskDueTime" name="kanblendar-taskDueTime">
                        <label for="kanblendar-taskColumn">Column:</label>
                        <select id="kanblendar-taskColumn" name="kanblendar-taskColumn"></select>
                        <label for="kanblendar-taskNotify">Notify Before (minutes):</label>
                        <input type="number" id="kanblendar-taskNotify" name="kanblendar-taskNotify" min="0">
                        <button type="submit">Save</button>
                        <button type="button" id="kanblendar-deleteTaskBtn" class="kanblendar-delete-task" style="display: none;">Delete</button>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.taskModal = document.getElementById('kanblendar-taskModal');
        this.closeModal = document.querySelector('.kanblendar-close');
        this.taskForm = document.getElementById('kanblendar-taskForm');
        this.deleteTaskBtn = document.getElementById('kanblendar-deleteTaskBtn');

        // Populate the column dropdown
        const taskColumnSelect = document.getElementById('kanblendar-taskColumn');
        this.columns.forEach(column => {
            const option = document.createElement('option');
            option.value = column.toLowerCase().replace(/\s+/g, '-');
            option.text = column;
            taskColumnSelect.appendChild(option);
        });

        this.deleteTaskBtn.addEventListener('click', () => {
            if (this.currentTask) {
                this.deleteTask(this.currentTask);
                this.closeModalFunc();
            }
        });
    }

    generateTimeSlots(startTime, endTime, interval) {
        const timeSlots = [];
        let currentTime = this.parseTime(startTime);
        const end = this.parseTime(endTime);

        while (currentTime < end) {
            timeSlots.push({
                display: this.formatTime(currentTime),
                value: currentTime.toTimeString().slice(0, 5) // HH:MM format
            });
            currentTime = this.addMinutes(currentTime, interval);
        }

        return timeSlots;
    }

    parseTime(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return new Date(1970, 0, 1, hours, minutes);
    }

    formatTime(date) {
        return new Intl.DateTimeFormat(navigator.language, {
            hour: 'numeric',
            minute: 'numeric'
        }).format(date);
    }

    addMinutes(date, minutes) {
        return new Date(date.getTime() + minutes * 60000);
    }

    generateKanbanColumns() {
        this.columns.forEach(column => {
            const columnElement = document.createElement('div');
            columnElement.classList.add('kanblendar-column');
            columnElement.id = column.toLowerCase().replace(/\s+/g, '-');
            columnElement.innerHTML = `<h2>${column}</h2><div class="kanblendar-non-timed-tasks" id="${column.toLowerCase().replace(/\s+/g, '-')}-tasks"></div>`;

            this.timeSlots.forEach(timeSlot => {
                const timeSlotElement = document.createElement('div');
                timeSlotElement.classList.add('kanblendar-time-slot');
                timeSlotElement.innerText = timeSlot.display;
                timeSlotElement.dataset.startTime = timeSlot.value;
                columnElement.appendChild(timeSlotElement);
            });

            this.kanbanSection.appendChild(columnElement);
        });

        this.adjustTimeSlotHeights(); // Ensure time slots have equal heights initially
    }

    initDragAndDrop() {
        const timeSlots = document.querySelectorAll('.kanblendar-time-slot, .kanblendar-non-timed-tasks');
        timeSlots.forEach(slot => {
            slot.addEventListener('dragover', (e) => this.dragOver(e));
            slot.addEventListener('drop', (e) => this.drop(e));
            slot.addEventListener('dragenter', (e) => this.dragEnter(e));
            slot.addEventListener('dragleave', (e) => this.dragLeave(e));
        });

        const tasks = document.querySelectorAll('.kanblendar-task');
        tasks.forEach(task => {
            task.addEventListener('dragstart', (e) => this.dragStart(e));
            task.addEventListener('click', (e) => this.openModal(task)); // Add click event to open modal for editing
        });
    }

    dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.id);
        e.dataTransfer.effectAllowed = 'move';
    }

    dragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    dragEnter(e) {
        e.preventDefault();
        if (e.target.classList.contains('kanblendar-task')) {
            e.target.parentElement.classList.add('kanblendar-drag-over');
        } else if (e.target.parentElement.classList.contains('kanblendar-task')) {
            e.target.parentElement.parentElement.classList.add('kanblendar-drag-over');
        } else {
            e.target.classList.add('kanblendar-drag-over');
        }
    }

    dragLeave(e) {
        if (e.target.classList.contains('kanblendar-task')) {
            e.target.parentElement.classList.remove('kanblendar-drag-over');
        } else if (e.target.parentElement.classList.contains('kanblendar-task')) {
            e.target.parentElement.parentElement.classList.remove('kanblendar-drag-over');
        } else {
            e.target.classList.remove('kanblendar-drag-over');
        }
    }

    drop(e) {
        e.preventDefault();
        if (e.target.classList.contains('kanblendar-task')) {
            e.target.parentElement.classList.remove('kanblendar-drag-over');
        } else if (e.target.parentElement.classList.contains('kanblendar-task')) {
            e.target.parentElement.parentElement.classList.remove('kanblendar-drag-over');
        } else {
            e.target.classList.remove('kanblendar-drag-over');
        }

        const id = e.dataTransfer.getData('text/plain');
        const task = document.getElementById(id);

        // Check if the drop target is a valid drop zone (time slot or non-timed tasks area)
        let dropTarget = e.target;
        if (dropTarget.classList.contains('kanblendar-task')) {
            dropTarget = dropTarget.parentElement;
        } else if (dropTarget.parentElement.classList.contains('kanblendar-task')) {
            dropTarget = dropTarget.parentElement.parentElement;
        }

        if (dropTarget.classList.contains('kanblendar-time-slot') || dropTarget.classList.contains('kanblendar-non-timed-tasks')) {
            dropTarget.appendChild(task);
            this.emitTaskMovedEvent(task, dropTarget);
            this.emitTaskChangedEvent('move', task);
        }

        // Update the task's due time if dropped in a time slot and the current due time is not valid for that slot
        if (dropTarget.classList.contains('kanblendar-time-slot')) {
            const startTime = dropTarget.dataset.startTime;
            const dueTime = new Date(task.dataset.dueTime);
            const slotStartTime = new Date(`${this.config.currentDate}T${startTime}:00`);
            const slotEndTime = this.addMinutes(slotStartTime, this.config.interval);

            if (!(dueTime >= slotStartTime && dueTime <= slotEndTime)) {
                task.dataset.dueTime = slotStartTime.toISOString();
            }
        }

        this.adjustTimeSlotHeights(); // Adjust heights after dropping a task
    }

    openModal(task = null) {
        this.currentTask = task;
        if (task) {
            document.getElementById('kanblendar-modalTitle').innerText = 'Edit Task';
            document.getElementById('kanblendar-taskTitle').value = task.querySelector('.kanblendar-task-title').innerText;
            document.getElementById('kanblendar-taskDescription').value = task.querySelector('.kanblendar-task-desc').innerText;
            document.getElementById('kanblendar-taskDueTime').value = task.dataset.dueTime || '';
            document.getElementById('kanblendar-taskColumn').value = task.dataset.column || '';
            document.getElementById('kanblendar-taskNotify').value = task.dataset.notifyBefore || '';
            this.deleteTaskBtn.style.display = 'block'; // Show delete button when editing
        } else {
            document.getElementById('kanblendar-modalTitle').innerText = 'Create Task';
            this.taskForm.reset();
            this.deleteTaskBtn.style.display = 'none'; // Hide delete button when creating
        }
        this.taskModal.style.display = 'flex';
    }

    closeModalFunc() {
        this.taskModal.style.display = 'none';
    }

    saveTask(event) {
        event.preventDefault();
        const title = document.getElementById('kanblendar-taskTitle').value;
        const description = document.getElementById('kanblendar-taskDescription').value;
        const dueTime = document.getElementById('kanblendar-taskDueTime').value || null;
        const column = document.getElementById('kanblendar-taskColumn').value;
        const notifyBefore = parseInt(document.getElementById('kanblendar-taskNotify').value, 10);

        let newTask = null;

        if (this.currentTask) {
            this.currentTask.querySelector('.kanblendar-task-title').innerText = title;
            this.currentTask.querySelector('.kanblendar-task-desc').innerText = description;
            this.currentTask.dataset.dueTime = dueTime;
            this.currentTask.dataset.column = column;
            this.currentTask.dataset.notifyBefore = notifyBefore;
            this.moveTaskToColumn(this.currentTask, column);
            if (dueTime) {
                this.updateTaskLocation(this.currentTask, dueTime);
            } else {
                this.moveTaskToNonTimedSection(this.currentTask, column);
            }
            this.cancelNotification(this.currentTask.id);
            this.emitTaskChangedEvent('edit', this.currentTask);
        } else {
            newTask = this.createTaskElement(title, description, dueTime, column, notifyBefore);
            this.moveTaskToColumn(newTask, column);
            if (dueTime) {
                this.updateTaskLocation(newTask, dueTime);
            } else {
                this.moveTaskToNonTimedSection(newTask, column);
            }
            this.emitTaskChangedEvent('create', newTask);
        }

        if (dueTime && notifyBefore >= 0) {
            this.scheduleNotification(title, description, new Date(dueTime), notifyBefore, this.currentTask ? this.currentTask.id : newTask.id);
        }

        this.adjustTimeSlotHeights(); // Adjust heights after saving a task
        this.closeModalFunc();
    }

    moveTaskToNonTimedSection(task, column) {
        const columnTasks = document.getElementById(`${column}-tasks`);
        if (columnTasks) {
            columnTasks.appendChild(task);
        }
    }

    createTaskElement(title, description, dueTime, column, notifyBefore) {
        const id = `task-${Date.now()}`;
        const newTask = document.createElement('div');
        newTask.classList.add('kanblendar-task');
        newTask.setAttribute('draggable', 'true');
        newTask.setAttribute('id', id);
        newTask.dataset.dueTime = dueTime;
        newTask.dataset.column = column;
        newTask.dataset.notifyBefore = notifyBefore;
        newTask.innerHTML = `
            <div class="kanblendar-task-title">${title}</div>
            <div class="kanblendar-task-desc">${description}</div>
        `;
        newTask.addEventListener('dragstart', (e) => this.dragStart(e));
        newTask.addEventListener('click', (e) => this.openModal(newTask)); // Add click event to open modal for editing
        this.tasks.set(id, { title, description, dueTime, column, notifyBefore });
        return newTask;
    }

    moveTaskToColumn(task, column) {
        const columnTasks = document.getElementById(`${column}-tasks`);
        if (columnTasks) {
            columnTasks.appendChild(task);
        }
    }

    updateTaskLocation(task, dueTime) {
        const taskDate = new Date(dueTime).toISOString().split('T')[0];
        if (taskDate === this.config.currentDate) {
            const taskTime = new Date(dueTime).toTimeString().slice(0, 5); // HH:MM format
            let placedInTimeSlot = false;

            document.querySelectorAll(`#${task.dataset.column} .kanblendar-time-slot`).forEach(timeSlotElement => {
                const startTime = timeSlotElement.dataset.startTime;
                const endTime = this.addMinutes(this.parseTime(startTime), this.config.interval).toTimeString().slice(0, 5);
                if (taskTime >= startTime && taskTime < endTime) {
                    timeSlotElement.appendChild(task);
                    placedInTimeSlot = true;
                }
            });

            if (!placedInTimeSlot) {
                const columnTasks = document.getElementById(`${task.dataset.column}-tasks`);
                columnTasks.appendChild(task);
            }
        } else {
            const columnTasks = document.getElementById(`${task.dataset.column}-tasks`);
            columnTasks.appendChild(task);
        }
    }

    deleteTask(task) {
        this.cancelNotification(task.id);
        task.remove();
        this.tasks.delete(task.id);
        this.adjustTimeSlotHeights(); // Adjust heights after deleting a task
        this.emitTaskChangedEvent('delete', task);
    }

    scheduleNotification(title, description, dueTime, notifyBefore, taskId) {
        const notifyTime = new Date(dueTime.getTime() - notifyBefore * 60000);
        const now = new Date();

        if (notifyTime > now) {
            const timeout = notifyTime.getTime() - now.getTime();
            const timeoutId = setTimeout(() => {
                this.showNotification(title, description);
                this.notificationTimeouts.delete(taskId);
            }, timeout);

            this.notificationTimeouts.set(taskId, timeoutId);
        }
    }

    cancelNotification(taskId) {
        if (this.notificationTimeouts.has(taskId)) {
            clearTimeout(this.notificationTimeouts.get(taskId));
            this.notificationTimeouts.delete(taskId);
        }
    }

    showNotification(title, description) {
        if (Notification.permission === 'granted') {
            new Notification(title, { body: description });
        } else {
            alert(`Reminder: ${title}\n${description}`);
        }
    }

    requestNotificationPermission() {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Notification permission granted.');
                } else {
                    console.log('Notification permission denied.');
                }
            });
        }
    }

    emitTaskMovedEvent(task, target) {
        const event = new CustomEvent('taskMoved', {
            detail: {
                taskId: task.id,
                newParent: target.id
            }
        });
        document.dispatchEvent(event);
    }

    adjustTimeSlotHeights() {
        const timeSlotMap = new Map();
        let maxNonTimedHeight = 0;

        // Collect heights of each time slot
        document.querySelectorAll('.kanblendar-time-slot').forEach(slot => {
            const startTime = slot.dataset.startTime;
            slot.style.height = 'auto'; // Remove any explicitly set height to get the actual height
            const height = slot.offsetHeight;

            if (!timeSlotMap.has(startTime)) {
                timeSlotMap.set(startTime, height);
            } else {
                const maxHeight = Math.max(timeSlotMap.get(startTime), height);
                timeSlotMap.set(startTime, maxHeight);
            }
        });

        // Collect heights of non-timed tasks sections
        document.querySelectorAll('.kanblendar-non-timed-tasks').forEach(section => {
            section.style.height = 'auto'; // Remove any explicitly set height to get the actual height
            const height = section.offsetHeight;
            maxNonTimedHeight = Math.max(maxNonTimedHeight, height);
        });

        // Apply the maximum height to all corresponding time slots
        document.querySelectorAll('.kanblendar-time-slot').forEach(slot => {
            const startTime = slot.dataset.startTime;
            slot.style.height = `${timeSlotMap.get(startTime)}px`;
        });

        // Apply the maximum height to all non-timed tasks sections
        document.querySelectorAll('.kanblendar-non-timed-tasks').forEach(section => {
            section.style.height = `${maxNonTimedHeight}px`;
        });
    }

    serialize() {
        const tasksArray = Array.from(this.tasks.entries()).map(([id, task]) => ({
            id,
            title: task.title,
            description: task.description,
            dueTime: task.dueTime,
            column: task.column,
            notifyBefore: task.notifyBefore
        }));
        return JSON.stringify(tasksArray);
    }

    deserialize(serializedData) {
        const tasksArray = JSON.parse(serializedData);
        tasksArray.forEach(taskData => {
            const { id, title, description, dueTime, column, notifyBefore } = taskData;
            const taskElement = this.createTaskElement(title, description, dueTime, column, notifyBefore);
            taskElement.id = id; // Restore original ID
            this.tasks.set(id, { title, description, dueTime, notifyBefore });
            this.moveTaskToColumn(taskElement, column);
            if (dueTime) {
                this.updateTaskLocation(taskElement, dueTime);
            } else {
                this.moveTaskToNonTimedSection(taskElement, column);
            }
        });
        this.adjustTimeSlotHeights();
    }

    emitTaskChangedEvent(action, task) {
        const event = new CustomEvent('taskChanged', {
            detail: {
                action,
                taskId: task.id
            }
        });
        document.dispatchEvent(event);
    }
}