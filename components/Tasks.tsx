
import React, { useState, useEffect } from 'react';
import { Task, Recurrence, UserProfile } from '../types';
import Modal from './Modal';
import { PlusIcon, TrashIcon, PencilIcon, CheckCircleIcon, ClockIcon, CalendarIcon } from './Icons';
import { formatDate, getNextRecurrenceDate } from '../utils/dateUtils';
import { sendNotification } from '../utils/notifications';
import { DAYS_OF_WEEK, REMINDER_OPTIONS } from '../constants';


interface TasksProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    profile: UserProfile;
}

const getRecurrenceText = (task: Task): string => {
    switch (task.recurrence) {
        case Recurrence.None:
            return '';
        case Recurrence.Daily:
            const dInterval = task.dailyInterval || 1;
            return `Repeats every ${dInterval} day${dInterval > 1 ? 's' : ''}`;
        case Recurrence.Weekly:
            if (task.weeklyDays && task.weeklyDays.length > 0) {
                const dayLabels = task.weeklyDays.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).filter(Boolean);
                 if (dayLabels.length === 7) return 'Repeats daily';
                if (dayLabels.length > 0) return `Repeats weekly on ${dayLabels.join(', ')}`;
            }
            return 'Repeats weekly';
        case Recurrence.Monthly:
            const mInterval = task.monthlyInterval || 1;
            return `Repeats every ${mInterval} month${mInterval > 1 ? 's' : ''}`;
        case Recurrence.Yearly:
            const yInterval = task.yearlyInterval || 1;
            return `Repeats every ${yInterval} year${yInterval > 1 ? 's' : ''}`;
        default:
             return `Repeats ${task.recurrence}`;
    }
};

const formatReminder = (totalMinutes: number): string => {
    if (totalMinutes <= 0) return '';
    const days = Math.floor(totalMinutes / 1440);
    const remainingMinutes = totalMinutes % 1440;
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;

    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} min`);
    
    return parts.length > 0 ? `${parts.join(', ')} before` : '';
};


const Tasks: React.FC<TasksProps> = ({ tasks, setTasks, profile }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [recurrenceEdit, setRecurrenceEdit] = useState<{ updatedTask: Task, originalTask: Task } | null>(null);
    
    const pendingTasks = tasks.filter(t => !t.isCompleted).sort((a, b) => {
        const aHasDueDate = !!a.dueDate;
        const bHasDueDate = !!b.dueDate;
    
        if (aHasDueDate && bHasDueDate) {
            const dateA = new Date(a.dueDate as string).getTime();
            const dateB = new Date(b.dueDate as string).getTime();
            if (dateA !== dateB) {
                return dateA - dateB;
            }
            return a.title.localeCompare(b.title);
        }
        
        if (aHasDueDate) return -1;
        if (bHasDueDate) return 1;
        
        return a.title.localeCompare(b.title);
    });
    const completedTasks = tasks.filter(t => t.isCompleted);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            
            pendingTasks.forEach(task => {
                if (task.dueDate && task.reminder && task.reminder > 0 && !task.isCompleted) {
                    const taskDueDate = new Date(task.dueDate);
                    const reminderTime = new Date(taskDueDate.getTime() - task.reminder * 60000);
                    const oneMinuteAfterReminder = new Date(reminderTime.getTime() + 60000);

                    if (now >= reminderTime && now < oneMinuteAfterReminder) {
                         const notifiedKey = `notified-task-${task.id}-${task.dueDate}`;
                         if (!localStorage.getItem(notifiedKey)) {
                            sendNotification('Task Reminder', {
                                body: `Your task "${task.title}" is due at ${taskDueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.`,
                                sound: profile.notificationSettings?.tasks ?? true
                            });
                             localStorage.setItem(notifiedKey, 'true');
                         }
                    }
                }
            });
        }, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [pendingTasks, profile.notificationSettings]);

    const openModal = (task: Task | null = null) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTask(null);
    };

    const handleSave = (task: Task) => {
        if (editingTask) {
            setTasks(tasks.map(t => t.id === task.id ? task : t));
        } else {
            setTasks([...tasks, { ...task, id: Date.now().toString() }]);
        }
        closeModal();
    };
    
    const handleDelete = (id: string) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    const handleBulkDelete = () => {
        setTasks(tasks.filter(t => !selectedTasks.includes(t.id)));
        setSelectedTasks([]);
    };

    const toggleSelection = (id: string) => {
        setSelectedTasks(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
    };

    const handleToggleComplete = (task: Task) => {
        if (task.recurrence !== Recurrence.None && !task.isCompleted) {
            const nextDueDate = getNextRecurrenceDate(task.dueDate!, task.recurrence, task.weeklyDays, task.monthlyInterval, task.dailyInterval, task.yearlyInterval);
            const updatedTask = { ...task, isCompleted: false, dueDate: nextDueDate };
            setRecurrenceEdit({ updatedTask, originalTask: task });
        } else {
            setTasks(tasks.map(t => t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t));
        }
    };
    
    const confirmRecurrence = (createNew: boolean) => {
        if (!recurrenceEdit) return;
        const { updatedTask, originalTask } = recurrenceEdit;
        if (createNew) {
            // Mark original as complete, create a new one for the next date
            setTasks(tasks.map(t => t.id === originalTask.id ? { ...originalTask, isCompleted: true } : t));
            setTasks(prev => [...prev, { ...updatedTask, id: Date.now().toString() }]);
        } else {
            // Just move the current one to the next date
            setTasks(tasks.map(t => t.id === originalTask.id ? updatedTask : t));
        }
        setRecurrenceEdit(null);
    };

    const TaskItem: React.FC<{ task: Task, onToggleComplete: (task: Task) => void }> = ({ task, onToggleComplete }) => (
        <div className={`p-4 rounded-lg shadow-md flex items-start space-x-4 transition-colors ${task.isCompleted ? 'bg-gray-100 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-800'}`}>
            <input type="checkbox" className="hidden" />
            <div className="flex-shrink-0 mt-1">
                 <button onClick={() => onToggleComplete(task)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    task.isCompleted 
                        ? 'bg-teal-500 border-teal-500' 
                        : 'border-gray-300 dark:border-gray-500 hover:border-teal-400'
                }`}
                aria-label={task.isCompleted ? `Mark '${task.title}' as incomplete` : `Mark '${task.title}' as complete`}
                >
                    {task.isCompleted && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </button>
            </div>
            <div className="flex-1">
                <p className={`font-medium ${task.isCompleted ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-white'}`}>{task.title}</p>
                {task.notes && <p className={`text-sm mt-1 whitespace-pre-wrap ${task.isCompleted ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>{task.notes}</p>}
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs">
                    {task.dueDate && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full ${new Date(task.dueDate) < new Date() && !task.isCompleted ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-gray-300'}`}>
                            <CalendarIcon className="w-4 h-4 mr-1.5" />
                            {formatDate(task.dueDate)}
                        </span>
                    )}
                    {task.recurrence !== Recurrence.None && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-gray-300">
                             <ClockIcon className="w-4 h-4 mr-1.5" />
                            {getRecurrenceText(task)}
                        </span>
                    )}
                     {task.reminder && task.reminder > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-gray-300">
                           <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                            {formatReminder(task.reminder)}
                        </span>
                    )}
                </div>
            </div>
            {!task.isCompleted && (
                <div className="flex space-x-2">
                    <button onClick={() => openModal(task)} className="text-gray-500 hover:text-blue-500"><PencilIcon /></button>
                    <button onClick={() => handleDelete(task.id)} className="text-gray-500 hover:text-red-500"><TrashIcon /></button>
                </div>
            )}
        </div>
    );

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">Tasks</h1>
                <div className="flex items-center space-x-2 self-stretch sm:self-auto justify-end">
                    {selectedTasks.length > 0 && (
                        <button onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
                            <TrashIcon className="mr-2" /> Delete ({selectedTasks.length})
                        </button>
                    )}
                    <button onClick={() => openModal()} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
                        <PlusIcon /> <span className="ml-2">New Task</span>
                    </button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h2 className="text-xl font-semibold mb-4 border-b-2 border-teal-500 pb-2">Pending</h2>
                     <div className="space-y-4">
                        {pendingTasks.length > 0 ? pendingTasks.map(task => <TaskItem key={task.id} task={task} onToggleComplete={handleToggleComplete} />) : <p className="text-gray-500 text-center">No pending tasks. Great job!</p>}
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-semibold mb-4 border-b-2 border-gray-400 dark:border-gray-600 pb-2">Completed</h2>
                    <div className="space-y-4">
                        {completedTasks.length > 0 ? completedTasks.map(task => <TaskItem key={task.id} task={task} onToggleComplete={handleToggleComplete} />) : <p className="text-gray-500 text-center">No tasks completed yet.</p>}
                    </div>
                </div>
            </div>
            
            <TaskForm isOpen={isModalOpen} onClose={closeModal} onSave={handleSave} task={editingTask} />

            <Modal isOpen={!!recurrenceEdit} onClose={() => setRecurrenceEdit(null)} title="Recurring Task Complete">
                <div className="space-y-4">
                    <p>You've completed a recurring task. What would you like to do?</p>
                    <div className="flex flex-col space-y-2">
                        <button onClick={() => confirmRecurrence(true)} className="px-4 py-2 text-left bg-gray-100 dark:bg-slate-700 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600">
                            <strong>Mark this one as done</strong> and create the next one.
                        </button>
                        <button onClick={() => confirmRecurrence(false)} className="px-4 py-2 text-left bg-gray-100 dark:bg-slate-700 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600">
                            <strong>Just move this task</strong> to its next scheduled date.
                        </button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};

const TaskForm: React.FC<{isOpen: boolean, onClose: () => void, onSave: (task: Task) => void, task: Task | null}> = ({ isOpen, onClose, onSave, task }) => {
    const [formState, setFormState] = useState<Partial<Task>>({});
    const [dateInput, setDateInput] = useState('');
    const [timeInput, setTimeInput] = useState('');
    const [hasDueDate, setHasDueDate] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    useEffect(() => {
        if (isOpen) {
            const initialTask = task || { 
                isCompleted: false, 
                recurrence: Recurrence.None, 
                reminder: 30,
                weeklyDays: [],
                monthlyInterval: 1,
                dailyInterval: 1,
                yearlyInterval: 1,
            };

            setHasDueDate(!!initialTask.dueDate);
            
            if (initialTask.dueDate) {
                const dateObj = new Date(initialTask.dueDate);
                setDateInput(dateObj.toISOString().split('T')[0]);
                setTimeInput(dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
            } else {
                setDateInput('');
                setTimeInput('');
            }
            
            setFormState(initialTask);
            setErrors({});
        }
    }, [task, isOpen]);
    
    useEffect(() => {
        if (!hasDueDate) {
            setDateInput('');
            setTimeInput('');
            setFormState(prev => ({ ...prev, dueDate: null, reminder: undefined }));
        } else if (hasDueDate && !dateInput && !timeInput) {
            const defaultDate = new Date();
            defaultDate.setHours(9, 0, 0, 0); // Default to 9:00 AM
            setDateInput(defaultDate.toISOString().split('T')[0]);
            setTimeInput('09:00');
        }
    }, [hasDueDate]);

     useEffect(() => {
        if (hasDueDate && dateInput && timeInput) {
            setFormState(prev => ({ ...prev, dueDate: new Date(`${dateInput}T${timeInput}`).toISOString() }));
        }
    }, [dateInput, timeInput, hasDueDate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => {
            const isNumberField = ['monthlyInterval', 'dailyInterval', 'yearlyInterval', 'reminder'].includes(name);
            const processedValue = isNumberField ? (parseInt(value, 10) || (name === 'reminder' ? 0 : 1)) : value;
            const newState: Partial<Task> = { ...prev, [name]: processedValue };
            if (name === 'recurrence' && value !== Recurrence.Weekly) newState.weeklyDays = [];
            return newState;
        });
        if (errors[name]) setErrors(prev => ({...prev, [name]: ''}));
    };

    const handleDayToggle = (dayValue: number) => {
        const currentDays = formState.weeklyDays || [];
        const newDays = currentDays.includes(dayValue) 
            ? currentDays.filter(d => d !== dayValue)
            : [...currentDays, dayValue];
        setFormState(prev => ({ ...prev, weeklyDays: newDays.sort((a, b) => a - b) }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formState.title?.trim()) newErrors.title = "Title is required.";
        if (hasDueDate && (!dateInput || !timeInput)) newErrors.date = "Due date and time are required if a due date is set.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSave(formState as Task);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={task ? "Edit Task" : "New Task"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium">Title</label>
                    <input type="text" name="title" value={formState.title || ''} onChange={handleChange} className={`mt-1 input-field ${errors.title ? 'border-red-500' : ''}`} />
                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium">Notes</label>
                    <textarea name="notes" value={formState.notes || ''} onChange={handleChange} rows={3} className="mt-1 input-field"></textarea>
                </div>
                <div className="flex items-center">
                    <input type="checkbox" id="hasDueDate" checked={hasDueDate} onChange={e => setHasDueDate(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                    <label htmlFor="hasDueDate" className="ml-2 block text-sm font-medium">Has Due Date</label>
                </div>
                 {hasDueDate && (
                    <div className="pl-4 border-l-2 border-gray-200 dark:border-slate-600 space-y-4 animate-fade-in">
                        <div>
                            <label className="block text-sm font-medium">Due Date & Time</label>
                            <div className="flex gap-4 mt-1">
                                <input type="date" value={dateInput} onChange={e => setDateInput(e.target.value)} className={`w-1/2 input-field ${errors.date ? 'border-red-500' : ''}`} />
                                <input type="time" value={timeInput} onChange={e => setTimeInput(e.target.value)} className={`w-1/2 input-field ${errors.date ? 'border-red-500' : ''}`} />
                            </div>
                            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Recurrence</label>
                            <select name="recurrence" value={formState.recurrence || Recurrence.None} onChange={handleChange} className="mt-1 input-field">
                                {Object.values(Recurrence).map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        {formState.recurrence === Recurrence.Daily && (
                            <div className="pl-4 border-l-2 border-gray-200 dark:border-slate-600">
                                <label className="block text-sm font-medium">Repeat Every</label>
                                <div className="flex items-center mt-1">
                                    <input type="number" name="dailyInterval" value={formState.dailyInterval || 1} onChange={handleChange} min="1" className="w-24 input-field" />
                                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">day(s)</span>
                                </div>
                            </div>
                        )}
                         {formState.recurrence === Recurrence.Weekly && (
                            <div className="pl-4 border-l-2 border-gray-200 dark:border-slate-600">
                                <label className="block text-sm font-medium">Repeat on</label>
                                <div className="mt-2 flex flex-wrap gap-2">
                                {DAYS_OF_WEEK.map(day => (
                                    <button type="button" key={day.value} onClick={() => handleDayToggle(day.value)} className={`px-3 py-1 text-sm rounded-full ${formState.weeklyDays?.includes(day.value) ? 'bg-teal-500 text-white' : 'bg-gray-200 dark:bg-slate-600'}`}>
                                    {day.label}
                                    </button>
                                ))}
                                </div>
                            </div>
                        )}
                        {formState.recurrence === Recurrence.Monthly && (
                             <div className="pl-4 border-l-2 border-gray-200 dark:border-slate-600">
                                <label className="block text-sm font-medium">Repeat Every</label>
                                <div className="flex items-center mt-1">
                                    <input type="number" name="monthlyInterval" value={formState.monthlyInterval || 1} onChange={handleChange} min="1" className="w-24 input-field" />
                                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">month(s)</span>
                                </div>
                            </div>
                        )}
                        {formState.recurrence === Recurrence.Yearly && (
                             <div className="pl-4 border-l-2 border-gray-200 dark:border-slate-600">
                                <label className="block text-sm font-medium">Repeat Every</label>
                                <div className="flex items-center mt-1">
                                    <input type="number" name="yearlyInterval" value={formState.yearlyInterval || 1} onChange={handleChange} min="1" className="w-24 input-field" />
                                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">year(s)</span>
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium">Reminder</label>
                            <select name="reminder" value={formState.reminder || 0} onChange={handleChange} className="mt-1 input-field">
                                {REMINDER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    </div>
                 )}
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600">Save</button>
                </div>
            </form>
            <style>{`
              .input-field {
                display: block; width: 100%; border-radius: 0.375rem;
                border-width: 1px; border-color: #D1D5DB; /* gray-300 */
                padding: 0.5rem 0.75rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                transition: border-color 0.2s, box-shadow 0.2s;
              }
              .dark .input-field {
                background-color: #334155; /* slate-700 */ border-color: #475569; /* slate-600 */
              }
              .input-field:focus {
                outline: 2px solid transparent; outline-offset: 2px;
                border-color: #14B8A6; box-shadow: 0 0 0 1px #14B8A6;
              }
              .input-field.border-red-500 { border-color: #EF4444; }
              .input-field.border-red-500:focus { box-shadow: 0 0 0 1px #EF4444; }
          `}</style>
        </Modal>
    );
};


export default Tasks;
