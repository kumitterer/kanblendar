document.addEventListener('DOMContentLoaded', () => {
    const kanblendar = new Kanblendar();
    const createTaskBtn = document.getElementById('createTaskBtn');
    createTaskBtn.addEventListener('click', () => kanblendar.openModal());  
});