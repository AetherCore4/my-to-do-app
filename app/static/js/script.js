// Auto-dismiss server-rendered flash messages
document.querySelectorAll('.flash').forEach(flash => {
    setTimeout(() => {
        flash.style.transition = 'opacity 0.4s ease';
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 400);
    }, 3500);
});

const taskForm = document.getElementById('taskForm');
const clearTasksForm = document.getElementById('clearTasksForm');
const taskTable = document.getElementById('taskTable');

const headers = {
    'X-Requested-With': 'XMLHttpRequest'
};

function createTaskRow(task) {
    const row = document.createElement('tr');
    row.dataset.taskId = task.id;

    row.innerHTML = `
        <td>${task.title}</td>
        <td><span class="badge ${task.status.toLowerCase()}">${task.status}</span></td>
        <td class="task-actions">
            <button type="button" class="btn btn-secondary action-toggle" data-task-id="${task.id}">Next</button>
            <button type="button" class="btn btn-danger action-delete" data-task-id="${task.id}">Delete</button>
        </td>
    `;

    return row;
}

function updateTaskRow(taskId, status) {
    const row = document.querySelector(`tr[data-task-id="${taskId}"]`);
    if (!row) return;
    const badge = row.querySelector('.badge');
    badge.textContent = status;
    badge.className = `badge ${status.toLowerCase()}`;
}

function removeTaskRow(taskId) {
    const row = document.querySelector(`tr[data-task-id="${taskId}"]`);
    if (row) {
        row.remove();
    }
}

function showFlash(message, category = 'info') {
    const flashWrapper = document.createElement('div');
    flashWrapper.className = `flash ${category}`;
    flashWrapper.textContent = message;

    const main = document.querySelector('main.container');
    if (main) {
        main.prepend(flashWrapper);
        setTimeout(() => flashWrapper.remove(), 3500);
    }
}

if (taskForm) {
    taskForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(taskForm);

        const response = await fetch(taskForm.action, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            return window.location.reload();
        }

        const data = await response.json();
        if (taskTable) {
            const tbody = taskTable.querySelector('tbody');
            if (tbody) {
                tbody.appendChild(createTaskRow(data));
                showFlash('Task added successfully', 'success');
                taskForm.reset();
            } else {
                window.location.reload();
            }
        } else {
            window.location.reload();
        }
    });
}

if (clearTasksForm) {
    clearTasksForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const response = await fetch(clearTasksForm.action, {
            method: 'POST',
            headers,
        });

        if (!response.ok) {
            return window.location.reload();
        }

        const data = await response.json();
        if (data.cleared && taskTable) {
            const tbody = taskTable.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = '';
            }
            showFlash('All tasks cleared', 'info');
        }
    });
}

if (taskTable) {
    taskTable.addEventListener('click', async (event) => {
        const toggleButton = event.target.closest('.action-toggle');
        const deleteButton = event.target.closest('.action-delete');

        if (toggleButton) {
            const taskId = toggleButton.dataset.taskId;
            const response = await fetch(`/toggle/${taskId}`, {
                method: 'POST',
                headers,
            });

            if (!response.ok) {
                return window.location.reload();
            }

            const data = await response.json();
            updateTaskRow(data.id, data.status);
        }

        if (deleteButton) {
            const taskId = deleteButton.dataset.taskId;
            const response = await fetch(`/delete/${taskId}`, {
                method: 'POST',
                headers,
            });

            if (!response.ok) {
                return window.location.reload();
            }

            const data = await response.json();
            if (data.id) {
                removeTaskRow(data.id);
                showFlash('Task deleted successfully', 'danger');
            }
        }
    });
}
