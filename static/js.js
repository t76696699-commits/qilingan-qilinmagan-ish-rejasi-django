document.addEventListener('DOMContentLoaded', () => {
    const sirtqiList = document.querySelector('.sirtqi_list');
    const ichidanOchiladigan = document.querySelector('.ichidan_ochiladigan');
    const subtaskHeaderTitle = document.getElementById('subtask-header-title');

    const addMainForm = document.getElementById('add-main-form');
    const addSubForm = document.getElementById('add-sub-form');
    const mainTaskSelect = document.getElementById('main_task_select');

    let activeMainId = null;

    sirtqiList.addEventListener('click', async (e) => {
        const trashBtn = e.target.closest('.delete-main');
        const mainCheckbox = e.target.closest('.main-checkbox');
        const item = e.target.closest('.main-item');

        if (!item) return;
        const mainId = item.dataset.id;

        if (mainCheckbox) {
            e.stopPropagation();
            const res = await fetch(`/api/main-task/toggle/${mainId}`, { method: 'POST' });
            if (res.ok) {
                const updated = await res.json();
                updateMainStatusUI(mainId, updated.is_completed);

                if (activeMainId === mainId) {
                    loadSubtasks(mainId);
                }
            }
            return;
        }

        if (trashBtn) {
            e.stopPropagation();
            if (confirm("Ushbu sirtqi vazifani va uning barcha ichki vazifalarini o'chirmoqchimisiz?")) {
                const res = await fetch(`/api/main-task/delete/${mainId}`, { method: 'DELETE' });
                if (res.ok) {
                    item.remove();
                    const opt = mainTaskSelect.querySelector(`option[value="${mainId}"]`);
                    if (opt) opt.remove();

                    if (activeMainId === mainId) {
                        activeMainId = null;
                        resetSubtasksView();
                    }
                }
            }
            return;
        }

        if (activeMainId === mainId) {
            item.classList.remove('active-main');
            activeMainId = null;
            resetSubtasksView();
            return;
        }

        document.querySelectorAll('.main-item').forEach(el => el.classList.remove('active-main'));
        item.classList.add('active-main');

        activeMainId = mainId;
        loadSubtasks(activeMainId);
    });

    function resetSubtasksView() {
        subtaskHeaderTitle.textContent = 'Ichidagi narsalar';
        ichidanOchiladigan.innerHTML = '<p class="placeholder-text">Sirtqi vazifalardan birini bosing...</p>';
    }

    async function loadSubtasks(mainId) {
        const res = await fetch(`/api/main-task/${mainId}/subtasks`);
        if (!res.ok) return;

        const data = await res.json();
        subtaskHeaderTitle.textContent = `${data.main_title} — Ichidagi narsalar`;
        ichidanOchiladigan.innerHTML = '';

        updateMainStatusUI(mainId, data.is_completed);

        if (data.subtasks.length === 0) {
            ichidanOchiladigan.innerHTML = '<p class="placeholder-text">Hali ichki vazifalar kiritilmagan</p>';
            return;
        }

        data.subtasks.forEach(sub => {
            const subRow = createSubtaskElement(sub);
            ichidanOchiladigan.appendChild(subRow);
        });
    }

    function createSubtaskElement(sub) {
        const row = document.createElement('div');
        row.className = 'sub-item';
        row.dataset.id = sub.id;

        const leftDiv = document.createElement('div');
        leftDiv.className = 'todo-left';

        const customBox = document.createElement('div');
        customBox.className = `custom-checkbox ${sub.is_done ? 'checked' : ''}`;

        const h2 = document.createElement('h2');
        h2.textContent = sub.title;

        leftDiv.appendChild(customBox);
        leftDiv.appendChild(h2);

        const rightDiv = document.createElement('div');
        rightDiv.className = 'todo-right';

        const trashBtn = document.createElement('i');
        trashBtn.className = 'fa-solid fa-trash delete-btn delete-sub';
        trashBtn.title = "O'chirish";

        rightDiv.appendChild(trashBtn);

        row.appendChild(leftDiv);
        row.appendChild(rightDiv);

        customBox.addEventListener('click', async (e) => {
            e.stopPropagation();
            const res = await fetch(`/api/subtask/toggle/${sub.id}`, { method: 'POST' });
            if (res.ok) {
                const updated = await res.json();
                customBox.classList.toggle('checked', updated.is_done);
                updateMainStatusUI(updated.main_task_id, updated.main_is_completed);
            }
        });

        trashBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const res = await fetch(`/api/subtask/delete/${sub.id}`, { method: 'DELETE' });
            if (res.ok) {
                const data = await res.json();
                row.remove();
                if (ichidanOchiladigan.children.length === 0) {
                    ichidanOchiladigan.innerHTML = '<p class="placeholder-text">Hali ichki vazifalar kiritilmagan</p>';
                }
                updateMainStatusUI(data.main_task_id, data.main_is_completed);
            }
        });

        return row;
    }

    function updateMainStatusUI(mainId, isCompleted) {
        const mainEl = document.querySelector(`.main-item[data-id="${mainId}"]`);
        if (!mainEl) return;

        const leftDiv = mainEl.querySelector('.todo-left');
        const mainBox = leftDiv.querySelector('.main-checkbox');
        let badge = leftDiv.querySelector('.completed-badge');

        if (isCompleted) {
            mainEl.classList.add('main-completed');
            if (mainBox) mainBox.classList.add('checked');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'completed-badge';
                badge.textContent = '✅ (Barchasi bajarildi)';
                leftDiv.appendChild(badge);
            }
        } else {
            mainEl.classList.remove('main-completed');
            if (mainBox) mainBox.classList.remove('checked');
            if (badge) badge.remove();
        }
    }

    addMainForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = addMainForm.querySelector('input[name="main_title"]');
        const title = input.value.trim();
        if (!title) return;

        const res = await fetch('/api/main-task/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        });

        if (res.ok) {
            const newMain = await res.json();

            const div = document.createElement('div');
            div.className = 'main-item';
            div.dataset.id = newMain.id;
            div.innerHTML = `
                <div class="todo-left">
                    <div class="custom-checkbox main-checkbox"></div>
                    <h2>${newMain.title}</h2>
                </div>
                <div class="todo-right">
                    <i class="fa-solid fa-trash delete-btn delete-main" title="O'chirish"></i>
                    <i class="fa-solid fa-chevron-right" style="color: #00ff66;"></i>
                </div>
            `;
            sirtqiList.appendChild(div);

            const option = document.createElement('option');
            option.value = newMain.id;
            option.textContent = newMain.title;
            mainTaskSelect.appendChild(option);

            input.value = '';
        }
    });

    addSubForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const mainId = mainTaskSelect.value;
        const input = addSubForm.querySelector('input[name="sub_title"]');
        const title = input.value.trim();

        if (!mainId || !title) return;

        const res = await fetch('/api/subtask/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ main_task_id: mainId, title })
        });

        if (res.ok) {
            const newSub = await res.json();

            if (activeMainId == mainId) {
                const placeholder = ichidanOchiladigan.querySelector('.placeholder-text');
                if (placeholder) placeholder.remove();

                const subRow = createSubtaskElement(newSub);
                ichidanOchiladigan.appendChild(subRow);
            }

            updateMainStatusUI(mainId, newSub.main_is_completed);
            input.value = '';
        }
    });
});