document.addEventListener('DOMContentLoaded', () => {
    window.kanblendar = new Kanblendar();
    const createTaskBtn = document.getElementById('createTaskBtn');
    createTaskBtn.addEventListener('click', () => window.kanblendar.openModal());

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