
import React, { useState, useEffect, useMemo } from 'react';
import { Appointment, Recurrence, UserProfile } from '../types';
import Modal from './Modal';
import { PlusIcon, TrashIcon, PencilIcon, CalendarIcon, ClockIcon, LocationMarkerIcon } from './Icons';
import { APPOINTMENT_TYPES, DAYS_OF_WEEK, REMINDER_OPTIONS } from '../constants';
import { formatDate, getNextRecurrenceDate } from '../utils/dateUtils';
import { sendNotification } from '../utils/notifications';

interface AppointmentsProps {
    appointments: Appointment[];
    setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
    profile: UserProfile;
}

const getRecurrenceText = (app: Appointment): string => {
    switch (app.recurrence) {
        case Recurrence.None:
            return '';
        case Recurrence.Daily:
            const dInterval = app.dailyInterval || 1;
            return `every ${dInterval} day${dInterval > 1 ? 's' : ''}`;
        case Recurrence.Weekly:
            if (app.weeklyDays && app.weeklyDays.length > 0) {
                const dayLabels = app.weeklyDays.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).filter(Boolean);
                if (dayLabels.length === 7) return 'daily';
                if (dayLabels.length > 0) return `weekly on ${dayLabels.join(', ')}`;
            }
            return 'weekly';
        case Recurrence.Monthly:
            const mInterval = app.monthlyInterval || 1;
            return `every ${mInterval} month${mInterval > 1 ? 's' : ''}`;
        case Recurrence.Yearly:
            const yInterval = app.yearlyInterval || 1;
            return `every ${yInterval} year${yInterval > 1 ? 's' : ''}`;
        default:
            return app.recurrence;
    }
};

const Appointments: React.FC<AppointmentsProps> = ({ appointments, setAppointments, profile }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [toDeleteIds, setToDeleteIds] = useState<string[]>([]);

    const sortedAppointments = useMemo(() => {
        return [...appointments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [appointments]);

    const upcomingAppointments = sortedAppointments.filter(a => new Date(a.date) >= new Date());
    const pastAppointments = sortedAppointments.filter(a => new Date(a.date) < new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            let hasChanges = false;
            
            // Check for past recurring appointments to reschedule them
            const updatedAppointments = appointments.map(app => {
                if (app.recurrence !== Recurrence.None && new Date(app.date) < now) {
                    hasChanges = true;
                    return { ...app, date: getNextRecurrenceDate(app.date, app.recurrence, app.weeklyDays, app.monthlyInterval, app.dailyInterval, app.yearlyInterval) };
                }
                return app;
            });

            if (hasChanges) {
                setAppointments(updatedAppointments);
            }

            // Check for reminders
            upcomingAppointments.forEach(app => {
                if (app.reminder > 0) {
                    const appDate = new Date(app.date);
                    const reminderTime = new Date(appDate.getTime() - app.reminder * 60000);
                    const oneMinuteAfterReminder = new Date(reminderTime.getTime() + 60000);

                    if (now >= reminderTime && now < oneMinuteAfterReminder) {
                        const notifiedKey = `notified-appt-${app.id}-${app.date}`;
                        if (!localStorage.getItem(notifiedKey)) {
                            sendNotification('Appointment Reminder', {
                                body: `Your appointment with ${app.provider} is at ${appDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.`,
                                sound: profile.notificationSettings?.appointments ?? true
                            });
                            localStorage.setItem(notifiedKey, 'true');
                        }
                    }
                }
            });

        }, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [appointments, setAppointments, upcomingAppointments, profile.notificationSettings]);

    const openModal = (appointment: Appointment | null = null) => {
        setEditingAppointment(appointment);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingAppointment(null);
    };

    const handleSave = (appointment: Appointment) => {
        if (editingAppointment) {
            setAppointments(appointments.map(a => a.id === appointment.id ? appointment : a));
        } else {
            setAppointments([...appointments, { ...appointment, id: Date.now().toString() }]);
        }
        closeModal();
    };

    const handleDelete = (id: string) => {
        setToDeleteIds([id]);
        setShowDeleteConfirm(true);
    };

    const handleBulkDelete = () => {
        if (selectedAppointments.length === 0) return;
        setToDeleteIds([...selectedAppointments]);
        setShowDeleteConfirm(true);
    };
    
    const executeDelete = () => {
        setAppointments(prev => prev.filter(a => !toDeleteIds.includes(a.id)));
        setSelectedAppointments(prev => prev.filter(id => !toDeleteIds.includes(id)));
        setShowDeleteConfirm(false);
        setToDeleteIds([]);
    };
    
    const toggleSelection = (id: string) => {
        setSelectedAppointments(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
    };

    const AppointmentCard: React.FC<{ appointment: Appointment }> = ({ appointment }) => (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex items-start space-x-4">
            <input type="checkbox" className="mt-1 form-checkbox h-5 w-5 text-teal-600 rounded" checked={selectedAppointments.includes(appointment.id)} onChange={() => toggleSelection(appointment.id)} />
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">{appointment.type === 'Other' ? appointment.customType : appointment.type}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">with {appointment.provider}</p>
                    </div>
                    <div className="flex space-x-2">
                        <button onClick={() => openModal(appointment)} className="text-gray-500 hover:text-blue-500"><PencilIcon /></button>
                        <button onClick={() => handleDelete(appointment.id)} className="text-gray-500 hover:text-red-500"><TrashIcon /></button>
                    </div>
                </div>
                <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 space-y-2">
                    <p className="flex items-center"><CalendarIcon /><span className="ml-2 font-mono">{formatDate(appointment.date)}</span></p>
                    {appointment.location && <p className="flex items-center"><LocationMarkerIcon /><span className="ml-2">{appointment.location}</span></p>}
                    {appointment.recurrence !== Recurrence.None && (
                        <p className="flex items-center"><ClockIcon /><span className="ml-2">
                            Repeats {getRecurrenceText(appointment)}
                        </span></p>
                    )}
                </div>
            </div>
        </div>
    );
    

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">Appointments</h1>
                <div className="flex items-center space-x-2 self-stretch sm:self-auto justify-end">
                    {selectedAppointments.length > 0 && (
                        <button onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
                            <TrashIcon className="mr-2" /> Delete ({selectedAppointments.length})
                        </button>
                    )}
                    <button onClick={() => openModal()} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
                        <PlusIcon /> <span className="ml-2">New Appointment</span>
                    </button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h2 className="text-xl font-semibold mb-4 border-b-2 border-teal-500 pb-2">Upcoming</h2>
                    <div className="space-y-4">
                        {upcomingAppointments.length > 0 ? upcomingAppointments.map(app => <AppointmentCard key={app.id} appointment={app} />) : <p className="text-gray-500 text-center">No upcoming appointments.</p>}
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-semibold mb-4 border-b-2 border-gray-400 dark:border-gray-600 pb-2">Past</h2>
                    <div className="space-y-4">
                        {pastAppointments.length > 0 ? pastAppointments.map(app => <AppointmentCard key={app.id} appointment={app} />) : <p className="text-gray-500 text-center">No past appointments.</p>}
                    </div>
                </div>
            </div>

            <AppointmentForm isOpen={isModalOpen} onClose={closeModal} onSave={handleSave} appointment={editingAppointment} />

            <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Confirm Deletion">
                <div className="space-y-4">
                    <p>Are you sure you want to delete {toDeleteIds.length > 1 ? `${toDeleteIds.length} appointments` : 'this appointment'}? This action cannot be undone.</p>
                    <div className="flex justify-end space-x-2">
                        <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300">
                            Cancel
                        </button>
                        <button onClick={executeDelete} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const AppointmentForm: React.FC<{isOpen: boolean, onClose: () => void, onSave: (appointment: Appointment) => void, appointment: Appointment | null}> = ({ isOpen, onClose, onSave, appointment }) => {
    const [formState, setFormState] = useState<Partial<Appointment>>({});
    const [dateInput, setDateInput] = useState('');
    const [timeInput, setTimeInput] = useState('');
    const [isCustomType, setIsCustomType] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [debouncedLocation, setDebouncedLocation] = useState('');

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formState.type) newErrors.type = "Type is required.";
        if (formState.type === 'Other' && !formState.customType) newErrors.customType = "Custom type is required.";
        if (!formState.provider?.trim()) newErrors.provider = "Provider is required.";
        if (!dateInput || !timeInput) newErrors.date = "Date and time are required.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        if (isOpen) {
            const initialAppointment = appointment || { 
                recurrence: Recurrence.None, 
                reminder: 30, 
                weeklyDays: [],
                monthlyInterval: 1,
                dailyInterval: 1,
                yearlyInterval: 1,
            };

            const dateObj = initialAppointment.date ? new Date(initialAppointment.date) : new Date();
            if (!appointment) { // New appointment default time rounding
                const mins = dateObj.getMinutes();
                dateObj.setMinutes(Math.ceil(mins / 15) * 15, 0, 0);
            }
            
            setDateInput(dateObj.toISOString().split('T')[0]);
            setTimeInput(dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));

            setFormState(initialAppointment);
            setIsCustomType(appointment?.type === 'Other');
            setErrors({});
            setDebouncedLocation(appointment?.location || '');
        }
    }, [appointment, isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handler = setTimeout(() => {
            setDebouncedLocation(formState.location || '');
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [formState.location, isOpen]);

    useEffect(() => {
        if (dateInput && timeInput) {
            setFormState(prev => ({ ...prev, date: new Date(`${dateInput}T${timeInput}`).toISOString() }));
        }
    }, [dateInput, timeInput]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        setFormState(prev => {
            const isNumberField = ['monthlyInterval', 'dailyInterval', 'yearlyInterval', 'reminder'].includes(name);
            const processedValue = isNumberField ? (parseInt(value, 10) || (name === 'reminder' ? 0 : 1)) : value;

            const newState: Partial<Appointment> = { ...prev, [name]: processedValue };
            
            if (name === 'type') {
                setIsCustomType(value === 'Other');
                if (value !== 'Other') newState.customType = '';
            }

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSave(formState as Appointment);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={appointment ? "Edit Appointment" : "New Appointment"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Type</label>
                    <select name="type" value={formState.type || ''} onChange={handleChange} className={`mt-1 input-field ${errors.type ? 'border-red-500' : ''}`}>
                        <option value="">Select a type</option>
                        {APPOINTMENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                    {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                </div>
                {isCustomType && (
                    <div>
                        <label className="block text-sm font-medium">Custom Type</label>
                        <input type="text" name="customType" value={formState.customType || ''} onChange={handleChange} className={`mt-1 input-field ${errors.customType ? 'border-red-500' : ''}`} />
                        {errors.customType && <p className="text-red-500 text-xs mt-1">{errors.customType}</p>}
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium">Provider</label>
                    <input type="text" name="provider" value={formState.provider || ''} onChange={handleChange} className={`mt-1 input-field ${errors.provider ? 'border-red-500' : ''}`} />
                    {errors.provider && <p className="text-red-500 text-xs mt-1">{errors.provider}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium">Date & Time</label>
                    <div className="flex gap-4 mt-1">
                        <input type="date" value={dateInput} onChange={e => setDateInput(e.target.value)} className={`w-1/2 input-field ${errors.date ? 'border-red-500' : ''}`} />
                        <input type="time" value={timeInput} onChange={e => setTimeInput(e.target.value)} className={`w-1/2 input-field ${errors.date ? 'border-red-500' : ''}`} />
                    </div>
                     {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium">Location</label>
                    <input type="text" name="location" value={formState.location || ''} onChange={handleChange} className="mt-1 input-field" placeholder="e.g., 123 Main St, Anytown" />
                    {debouncedLocation && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600 animate-fade-in">
                            <iframe
                                width="100%"
                                height="200"
                                loading="lazy"
                                allowFullScreen
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(debouncedLocation)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                                className="border-0"
                                title="Location Map"
                            ></iframe>
                        </div>
                    )}
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
                {formState.recurrence === Recurrence.Weekly && (
                  <div className="pl-4 border-l-2 border-gray-200 dark:border-slate-600">
                    <label className="block text-sm font-medium">Repeat on</label>
                    <div className="mt-2 flex space-x-2">
                      {DAYS_OF_WEEK.map(day => (
                        <button type="button" key={day.value} onClick={() => handleDayToggle(day.value)} className={`px-3 py-1 text-sm rounded-full ${formState.weeklyDays?.includes(day.value) ? 'bg-teal-500 text-white' : 'bg-gray-200 dark:bg-slate-600'}`}>
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                    <label className="block text-sm font-medium">Reminder</label>
                    <select name="reminder" value={formState.reminder || 0} onChange={handleChange} className="mt-1 input-field">
                        {REMINDER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">Notes</label>
                    <textarea name="notes" value={formState.notes || ''} onChange={handleChange} rows={3} className="mt-1 input-field"></textarea>
                </div>
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

export default Appointments;
