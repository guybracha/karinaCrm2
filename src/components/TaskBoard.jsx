import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
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

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

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
    <div 
      ref={setNodeRef}
      className={`task-column ${isOver ? 'task-column-over' : ''}`}
    >
      <div className="task-column-header" style={{ borderColor: column.color }}>
        <h4>{column.title}</h4>
        <span className="task-count">{columnTasks.length}</span>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="task-list" style={{ minHeight: '100px' }}>
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
          {columnTasks.length === 0 && (
            <div className="task-column-empty">
              גרור משימות לכאן
            </div>
          )}
        </div>
      </SortableContext>

      {showAddForm ? (
        <form className="task-add-form" onSubmit={handleAddTask}>
          <div className="task-add-form-header">
            <span>משימה חדשה</span>
            <button 
              type="button" 
              className="task-add-close"
              onClick={() => {
                setShowAddForm(false);
                setNewTaskTitle('');
                setNewTaskDueDate('');
              }}
              title="סגור"
            >
              ✕
            </button>
          </div>
          
          <div className="task-add-field">
            <label htmlFor={`task-title-${column.id}`}>שם המשימה</label>
            <input
              id={`task-title-${column.id}`}
              type="text"
              placeholder="הזן את שם המשימה..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              autoFocus
              required
            />
          </div>
          
          <div className="task-add-field">
            <label htmlFor={`task-date-${column.id}`}>תאריך יעד (אופציונלי)</label>
            <input
              id={`task-date-${column.id}`}
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
            />
          </div>
          
          <div className="task-add-actions">
            <button type="submit" className="task-add-submit">
              ✓ הוסף משימה
            </button>
            <button 
              type="button" 
              className="task-add-cancel" 
              onClick={() => {
                setShowAddForm(false);
                setNewTaskTitle('');
                setNewTaskDueDate('');
              }}
            >
              ביטול
            </button>
          </div>
        </form>
      ) : (
        <button className="task-add-btn" onClick={() => setShowAddForm(true)}>
          <span className="task-add-icon">+</span>
          <span>הוסף משימה</span>
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
    if (!activeTask) return;

    const activeIndex = tasks.findIndex((t) => t.id === active.id);
    let newTasks = [...tasks];

    // אם גררנו על עמודה (column id)
    if (over.id === 'todo' || over.id === 'in-progress' || over.id === 'done') {
      if (activeTask.status !== over.id) {
        // שינוי סטטוס לעמודה החדשה
        newTasks[activeIndex] = { ...activeTask, status: over.id };
        onChange?.(newTasks);
      }
      return;
    }

    // אם גררנו על משימה אחרת
    const overTask = tasks.find((t) => t.id === over.id);
    if (!overTask) return;

    const overIndex = tasks.findIndex((t) => t.id === over.id);

    // אם בתוך אותה עמודה - שנה רק סדר
    if (activeTask.status === overTask.status) {
      newTasks = arrayMove(tasks, activeIndex, overIndex);
    } else {
      // אם בין עמודות - שנה סטטוס והזז
      newTasks[activeIndex] = { ...activeTask, status: overTask.status };
      newTasks = arrayMove(newTasks, activeIndex, overIndex);
    }

    onChange?.(newTasks);
  }

  function handleDragOver(event) {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // אם גוררים על עמודה
    if (over.id === 'todo' || over.id === 'in-progress' || over.id === 'done') {
      if (activeTask.status === over.id) return;
      
      const activeIndex = tasks.findIndex((t) => t.id === active.id);
      let newTasks = [...tasks];
      newTasks[activeIndex] = { ...activeTask, status: over.id };
      onChange?.(newTasks);
      return;
    }

    // אם גוררים על משימה אחרת
    const overTask = tasks.find((t) => t.id === over.id);
    if (!overTask || activeTask.id === overTask.id) return;
    if (activeTask.status === overTask.status) return;

    const activeIndex = tasks.findIndex((t) => t.id === active.id);
    let newTasks = [...tasks];
    newTasks[activeIndex] = { ...activeTask, status: overTask.status };
    onChange?.(newTasks);
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
        collisionDetection={pointerWithin}
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
      
      <style jsx>{`
        .task-column-over {
          background: rgba(0, 123, 255, 0.05);
          border: 2px dashed #007bff;
          border-radius: 8px;
        }
        
        .task-column-empty {
          padding: 2rem;
          text-align: center;
          color: #999;
          font-size: 0.9rem;
          border: 2px dashed #ddd;
          border-radius: 8px;
          margin: 1rem 0;
        }
        
        .task-card-overlay {
          background: white;
          box-shadow: 0 8px 16px rgba(0,0,0,0.15);
          border-radius: 6px;
          padding: 0.75rem;
          cursor: grabbing;
          transform: rotate(3deg);
        }
        
        /* טופס הוספת משימה משופר */
        .task-add-form {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 1rem;
          margin-top: 0.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .task-add-form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          font-weight: 600;
          color: #333;
          font-size: 0.95rem;
        }
        
        .task-add-close {
          background: none;
          border: none;
          font-size: 1.2rem;
          color: #6c757d;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .task-add-close:hover {
          background: #e9ecef;
          color: #495057;
        }
        
        .task-add-field {
          margin-bottom: 0.75rem;
        }
        
        .task-add-field label {
          display: block;
          margin-bottom: 0.25rem;
          font-size: 0.85rem;
          font-weight: 500;
          color: #495057;
        }
        
        .task-add-field input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #ced4da;
          border-radius: 6px;
          font-size: 0.9rem;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        
        .task-add-field input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
        }
        
        .task-add-field input[type="date"] {
          cursor: pointer;
        }
        
        .task-add-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        
        .task-add-submit {
          flex: 1;
          padding: 0.6rem 1rem;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        
        .task-add-submit:hover {
          background: #218838;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(40,167,69,0.2);
        }
        
        .task-add-submit:active {
          transform: translateY(0);
        }
        
        .task-add-cancel {
          padding: 0.6rem 1rem;
          background: white;
          color: #6c757d;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          font-weight: 500;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .task-add-cancel:hover {
          background: #f8f9fa;
          border-color: #adb5bd;
          color: #495057;
        }
        
        .task-add-btn {
          width: 100%;
          padding: 0.75rem;
          background: white;
          color: #6c757d;
          border: 2px dashed #dee2e6;
          border-radius: 6px;
          font-weight: 500;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        
        .task-add-btn:hover {
          background: #f8f9fa;
          border-color: #adb5bd;
          color: #495057;
          border-style: solid;
        }
        
        .task-add-icon {
          font-size: 1.2rem;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}
