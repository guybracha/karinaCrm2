import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { generateId } from '../lib/id';

const COLUMNS = {
  todo: { id: 'todo', title: 'לביצוע', color: '#e3e6ef' },
  'in-progress': { id: 'in-progress', title: 'בתהליך', color: '#ffd2b5' },
  done: { id: 'done', title: 'הושלם', color: '#9ee8c5' },
};

function TaskCard({ task, isOverlay = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (isOverlay) {
    return (
      <div className="task-card task-card-overlay">
        <div className="task-card-content">
          <strong>{task.title}</strong>
          {task.dueDate && <small className="task-due-date">תאריך יעד: {task.dueDate}</small>}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="task-card"
      {...attributes}
      {...listeners}
    >
      <div className="task-card-content">
        <div className="task-card-drag-handle">⋮⋮</div>
        <div className="task-card-text">
          <strong>{task.title}</strong>
          {task.dueDate && <small className="task-due-date">תאריך יעד: {task.dueDate}</small>}
        </div>
      </div>
    </div>
  );
}

function TaskColumn({ column, tasks, onAddTask, onDeleteTask }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  const columnTasks = tasks.filter((task) => task.status === column.id);
  const taskIds = columnTasks.map((task) => task.id);

  function handleAddTask(e) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    onAddTask({
      id: generateId(),
      title: newTaskTitle.trim(),
      status: column.id,
      dueDate: newTaskDueDate || null,
      createdAt: new Date().toISOString(),
    });

    setNewTaskTitle('');
    setNewTaskDueDate('');
    setShowAddForm(false);
  }

  return (
    <div className="task-column">
      <div className="task-column-header" style={{ borderColor: column.color }}>
        <h4>{column.title}</h4>
        <span className="task-count">{columnTasks.length}</span>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="task-list">
          {columnTasks.map((task) => (
            <div key={task.id} className="task-item">
              <TaskCard task={task} />
              <button
                className="task-delete-btn"
                onClick={() => onDeleteTask(task.id)}
                title="מחק משימה"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </SortableContext>

      {showAddForm ? (
        <form className="task-add-form" onSubmit={handleAddTask}>
          <input
            type="text"
            placeholder="שם המשימה..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            autoFocus
          />
          <input
            type="date"
            value={newTaskDueDate}
            onChange={(e) => setNewTaskDueDate(e.target.value)}
            placeholder="תאריך יעד (אופציונלי)"
          />
          <div className="task-add-actions">
            <button type="submit">הוסף</button>
            <button type="button" className="ghost" onClick={() => setShowAddForm(false)}>
              ביטול
            </button>
          </div>
        </form>
      ) : (
        <button className="task-add-btn ghost" onClick={() => setShowAddForm(true)}>
          + הוסף משימה
        </button>
      )}
    </div>
  );
}

export default function TaskBoard({ tasks = [], onChange, disabled }) {
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event) {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    setActiveTask(task);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    const overTask = tasks.find((t) => t.id === over.id);

    if (!activeTask) return;

    let newTasks = [...tasks];

    // אם גררנו על משימה אחרת
    if (overTask && activeTask.id !== overTask.id) {
      const activeIndex = tasks.findIndex((t) => t.id === active.id);
      const overIndex = tasks.findIndex((t) => t.id === over.id);

      // אם בתוך אותה עמודה - שנה סדר
      if (activeTask.status === overTask.status) {
        newTasks = arrayMove(tasks, activeIndex, overIndex);
      } else {
        // אם בין עמודות - שנה סטטוס
        newTasks[activeIndex] = { ...activeTask, status: overTask.status };
      }
    }

    onChange?.(newTasks);
  }

  function handleDragOver(event) {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    const overTask = tasks.find((t) => t.id === over.id);

    if (!activeTask || !overTask) return;
    if (activeTask.status === overTask.status) return;

    const activeIndex = tasks.findIndex((t) => t.id === active.id);
    const overIndex = tasks.findIndex((t) => t.id === over.id);

    let newTasks = [...tasks];
    newTasks[activeIndex] = { ...activeTask, status: overTask.status };

    // מיון מחדש
    const reordered = arrayMove(newTasks, activeIndex, overIndex);
    onChange?.(reordered);
  }

  function handleAddTask(newTask) {
    onChange?.([...tasks, newTask]);
  }

  function handleDeleteTask(taskId) {
    onChange?.(tasks.filter((t) => t.id !== taskId));
  }

  return (
    <div className="task-board">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="task-columns">
          {Object.values(COLUMNS).map((column) => (
            <TaskColumn
              key={column.id}
              column={column}
              tasks={tasks}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {tasks.length === 0 && (
        <p className="empty-state">אין משימות. הוסיפו משימה חדשה בעמודה הרצויה.</p>
      )}
    </div>
  );
}
