document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('kanblendarDate');
    const kanbanSection = document.getElementById('kanblendar');

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // Initialize Kanblendar with today's date
    window.kanblendar = new Kanblendar({
        currentDate: today
    });

    const createTaskBtn = document.getElementById('createTaskBtn');
    createTaskBtn.addEventListener('click', () => window.kanblendar.openModal());

    const updateDateBtn = document.getElementById('updateDateBtn');
    updateDateBtn.addEventListener('click', updateKanblendarDate);

    function updateKanblendarDate() {
        const selectedDate = dateInput.value;
        kanbanSection.innerHTML = ''; // Clear existing tasks and columns
        window.kanblendar = new Kanblendar({
            currentDate: selectedDate
        });

        const serializedState = localStorage.getItem('kanblendarState');
        if (serializedState) {
            window.kanblendar.deserialize(serializedState);
        }
    }

    function saveState() {
        const serializedState = kanblendar.serialize();
        localStorage.setItem('kanblendarState', serializedState);
        console.log('State saved!');
    }

    document.addEventListener('taskChanged', saveState);

    const serializedState = localStorage.getItem('kanblendarState');
    if (serializedState) {
        kanblendar.deserialize(serializedState);
        console.log('State loaded on page load!');
    }
});

function clearState() {
    if (!confirm('Are you sure you want to clear the state?')) {
        return;
    }

    localStorage.removeItem('kanblendarState');
    console.log('State cleared!');
    document.location.reload();
}
