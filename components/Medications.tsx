
import React, { useState, useEffect } from 'react';
import { Medication, Recurrence, UserProfile } from '../types';
import Modal from './Modal';
import { PlusIcon, TrashIcon, PencilIcon, ClockIcon, CheckCircleIcon } from './Icons';
import { MEDICATION_UNITS, DAYS_OF_WEEK } from '../constants';
import { sendNotification } from '../utils/notifications';
import { formatDate, getNextRecurrenceDate } from '../utils/dateUtils';

interface MedicationsProps {
    medications: Medication[];
    setMedications: React.Dispatch<React.SetStateAction<Medication[]>>;
    profile: UserProfile;
}

const getRecurrenceText = (med: Medication): string => {
    switch (med.recurrence) {
        case Recurrence.None:
            return '';
        case Recurrence.Daily:
            const dInterval = med.dailyInterval || 1;
            return `every ${dInterval} day${dInterval > 1 ? 's' : ''}`;
        case Recurrence.Weekly:
            if (med.weeklyDays && med.weeklyDays.length > 0) {
                const dayLabels = med.weeklyDays.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).filter(Boolean);
                if (dayLabels.length === 7) return 'daily';
                if (dayLabels.length > 0) return `weekly on ${dayLabels.join(', ')}`;
            }
            return 'weekly';
        case Recurrence.Monthly:
            const mInterval = med.monthlyInterval || 1;
            return `every ${mInterval} month${mInterval > 1 ? 's' : ''}`;
        case Recurrence.Yearly:
            const yInterval = med.yearlyInterval || 1;
            return `every ${yInterval} year${yInterval > 1 ? 's' : ''}`;
        default:
            return med.recurrence;
    }
}

const Medications: React.FC<MedicationsProps> = ({ medications, setMedications, profile }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
    const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
    
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            let medicationsWithUpdates = [...medications];
            let hasChanges = false;

            medications.forEach(med => {
                med.reminders.forEach(reminderISO => {
                    if (!reminderISO) return;
                    const reminderDate = new Date(reminderISO);
                    const oneMinuteAgo = new Date(now.getTime() - 60000);
                    
                    if (reminderDate > oneMinuteAgo && reminderDate <= now) {
                        const notifiedKey = `notified-med-${med.id}-${reminderISO}`;
                        if (!localStorage.getItem(notifiedKey)) {
                            sendNotification('Medication Reminder', {
                                body: `Time to take your ${med.name} (${med.dosage} ${med.dosageUnit}).`,
                                sound: profile.notificationSettings?.medications ?? true
                            });
                            localStorage.setItem(notifiedKey, 'true');
                        }
                    }
                });
            });

            medicationsWithUpdates = medicationsWithUpdates.map(med => {
                if (med.recurrence && med.recurrence !== Recurrence.None) {
                    let medicationWasUpdated = false;
                    const newReminders = med.reminders.map(reminderISO => {
                        let nextReminderDate = new Date(reminderISO);
                        if (nextReminderDate < now) {
                            while (nextReminderDate < now) {
                                nextReminderDate = new Date(getNextRecurrenceDate(nextReminderDate.toISOString(), med.recurrence, med.weeklyDays, med.monthlyInterval, med.dailyInterval, med.yearlyInterval));
                            }
                            medicationWasUpdated = true;
                            hasChanges = true;
                            return nextReminderDate.toISOString();
                        }
                        return reminderISO;
                    });
                    if (medicationWasUpdated) {
                        return { ...med, reminders: newReminders };
                    }
                }
                return med;
            });
            
            if (hasChanges) {
                setMedications(medicationsWithUpdates);
            }

        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [medications, setMedications, profile.notificationSettings]);

    const openModal = (medication: Medication | null = null) => {
        setEditingMedication(medication);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingMedication(null);
    };

    const handleSave = (medication: Medication) => {
        if (editingMedication) {
            setMedications(medications.map(m => m.id === medication.id ? medication : m));
        } else {
             const newMedication: Medication = {
                ...medication,
                id: Date.now().toString(),
                streak: { count: 0, lastTakenDate: null }
            };
            setMedications([...medications, newMedication]);
        }
        closeModal();
    };

    const handleDelete = (id: string) => {
        setMedications(medications.filter(m => m.id !== id));
    };

    const handleBulkDelete = () => {
        setMedications(medications.filter(m => !selectedMeds.includes(m.id)));
        setSelectedMeds([]);
    };

    const toggleSelection = (id: string) => {
        setSelectedMeds(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
    };
    
    const handleLogMedication = (id: string) => {
        setMedications(meds => meds.map(med => {
            if (med.id === id) {
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];
    
                const lastTakenDateStr = med.streak?.lastTakenDate;
                
                if (lastTakenDateStr === todayStr) {
                    return med; // Already logged today
                }
    
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];
                
                const currentCount = med.streak?.count || 0;
                const newCount = (lastTakenDateStr === yesterdayStr) ? currentCount + 1 : 1;
                
                return {
                    ...med,
                    streak: {
                        count: newCount,
                        lastTakenDate: todayStr,
                    }
                };
            }
            return med;
        }));
    };

    const MedicationCard: React.FC<{ medication: Medication }> = ({ medication }) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const loggedToday = medication.streak?.lastTakenDate === todayStr;

        const getStreakSubtext = (): string | null => {
            if (!medication.streak?.lastTakenDate) return null;

            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);

            const [year, month, day] = medication.streak.lastTakenDate.split('-').map(Number);
            const lastTaken = new Date(Date.UTC(year, month - 1, day));

            const diffTime = today.getTime() - lastTaken.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return "Last logged: Today";
            if (diffDays === 1) return "Last logged: Yesterday";
            return `Last logged: ${diffDays} days ago`;
        };

        return (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex flex-col justify-between space-y-4">
                <div className="flex items-start space-x-4">
                    <input type="checkbox" className="mt-1 form-checkbox h-5 w-5 text-teal-600 rounded" checked={selectedMeds.includes(medication.id)} onChange={() => toggleSelection(medication.id)} />
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800 dark:text-white">{medication.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {medication.dosage} {medication.dosageUnit === 'Other' ? medication.customDosageUnit : medication.dosageUnit}
                                </p>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => openModal(medication)} className="text-gray-500 hover:text-blue-500"><PencilIcon /></button>
                                <button onClick={() => handleDelete(medication.id)} className="text-gray-500 hover:text-red-500"><TrashIcon /></button>
                            </div>
                        </div>
                        <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 space-y-2">
                            <p>{medication.frequency}</p>
                            {medication.notes && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic whitespace-pre-wrap">Note: {medication.notes}</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                            {medication.reminders.sort((a,b) => new Date(a).getTime() - new Date(b).getTime()).map(isoString => (
                                <span key={isoString} className="bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-xs font-mono font-medium px-2.5 py-0.5 rounded-full">{formatDate(isoString)}</span>
                            ))}
                            </div>
                            {medication.recurrence && medication.recurrence !== Recurrence.None && (
                                <p className="flex items-center text-xs text-gray-500 dark:text-gray-400 pt-1">
                                    <ClockIcon className="w-4 h-4 mr-1.5" />
                                    <span>
                                        Repeats {getRecurrenceText(medication)}
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
                    <div>
                        {medication.streak && medication.streak.count > 0 && (
                             <div className="animate-fade-in">
                                <span className="text-sm font-semibold text-orange-500 flex items-center">
                                    🔥 {medication.streak.count} day streak
                                </span>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{getStreakSubtext()}</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => handleLogMedication(medication.id)}
                        disabled={loggedToday}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center ${
                            loggedToday 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 cursor-not-allowed' 
                            : 'bg-teal-500 text-white hover:bg-teal-600'
                        }`}
                    >
                        {loggedToday ? (
                            <><CheckCircleIcon className="w-4 h-4 mr-1.5"/> Logged</>
                        ) : 'Log Dose'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">Medications</h1>
                <div className="flex items-center space-x-2 self-stretch sm:self-auto justify-end">
                    {selectedMeds.length > 0 && (
                        <button onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
                            <TrashIcon className="mr-2" /> Delete ({selectedMeds.length})
                        </button>
                    )}
                    <button onClick={() => openModal()} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
                        <PlusIcon /> <span className="ml-2">New Medication</span>
                    </button>
                </div>
            </div>
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {medications.length > 0 ? medications.map(med => <MedicationCard key={med.id} medication={med}/>) : <p className="text-gray-500 col-span-full text-center py-8">No medications added yet.</p>}
                </div>
            </div>
            <MedicationForm isOpen={isModalOpen} onClose={closeModal} onSave={handleSave} medication={editingMedication} />
        </div>
    );
};

const MedicationForm: React.FC<{ isOpen: boolean, onClose: () => void, onSave: (med: Medication) => void, medication: Medication | null }> = ({ isOpen, onClose, onSave, medication }) => {
    const [formState, setFormState] = useState<Partial<Medication>>({});
    const [reminderInput, setReminderInput] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formState.name?.trim()) newErrors.name = "Medication name is required.";
        if (!formState.dosage || formState.dosage <= 0) newErrors.dosage = "Dosage must be a positive number.";
        if (formState.dosageUnit === 'Other' && !formState.customDosageUnit?.trim()) newErrors.customDosageUnit = "Custom unit is required.";
        if (!formState.frequency?.trim()) newErrors.frequency = "Frequency is required.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    useEffect(() => {
        if (isOpen) {
            setFormState(medication || { 
                dosage: 1, 
                dosageUnit: 'tablet(s)', 
                reminders: [], 
                recurrence: Recurrence.None,
                notes: '',
                monthlyInterval: 1, 
                dailyInterval: 1,
                yearlyInterval: 1,
                weeklyDays: [],
            });
            setReminderInput('');
            setErrors({});
        }
    }, [medication, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => {
            let processedValue: string | number = value;
            if (name === 'dosage' || name === 'monthlyInterval' || name === 'dailyInterval' || name === 'yearlyInterval') {
                processedValue = name === 'dosage' ? parseFloat(value) : parseInt(value, 10);
                if (isNaN(processedValue)) processedValue = name === 'dosage' ? 0 : 1;
            }

            const newState: Partial<Medication> = { ...prev, [name]: processedValue };
            
            if (name === 'dosageUnit' && value !== 'Other') newState.customDosageUnit = '';
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

    const addReminder = () => {
        if (reminderInput) {
            const newReminderDate = new Date(reminderInput).toISOString();
            if(!formState.reminders?.includes(newReminderDate)){
                setFormState(prev => ({ ...prev, reminders: [...(prev.reminders || []), newReminderDate].sort() }));
            }
            setReminderInput('');
        }
    };
    
    const removeReminder = (isoString: string) => {
        setFormState(prev => ({ ...prev, reminders: prev.reminders?.filter(r => r !== isoString) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSave(formState as Medication);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={medication ? "Edit Medication" : "New Medication"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Medication Name</label>
                    <input type="text" name="name" value={formState.name || ''} onChange={handleChange} className={`mt-1 input-field ${errors.name ? 'border-red-500' : ''}`} />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div className="flex space-x-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium">Dosage</label>
                        <input type="number" name="dosage" value={formState.dosage || ''} onChange={handleChange} step="any" min="0" className={`mt-1 input-field ${errors.dosage ? 'border-red-500' : ''}`} />
                        {errors.dosage && <p className="text-red-500 text-xs mt-1">{errors.dosage}</p>}
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium">Unit</label>
                        <select name="dosageUnit" value={formState.dosageUnit || ''} onChange={handleChange} className="mt-1 input-field">
                            {MEDICATION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                </div>
                {formState.dosageUnit === 'Other' && (
                    <div>
                        <label className="block text-sm font-medium">Specify Unit</label>
                        <input type="text" name="customDosageUnit" value={formState.customDosageUnit || ''} onChange={handleChange} placeholder="e.g., scoop(s)" className={`mt-1 input-field ${errors.customDosageUnit ? 'border-red-500' : ''}`} />
                        {errors.customDosageUnit && <p className="text-red-500 text-xs mt-1">{errors.customDosageUnit}</p>}
                    </div>
                )}
                 <div>
                    <label className="block text-sm font-medium">Frequency / Instructions</label>
                    <input type="text" name="frequency" placeholder="e.g., Once a day with food" value={formState.frequency || ''} onChange={handleChange} className={`mt-1 input-field ${errors.frequency ? 'border-red-500' : ''}`} />
                    {errors.frequency && <p className="text-red-500 text-xs mt-1">{errors.frequency}</p>}
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
                    <label className="block text-sm font-medium">Reminders</label>
                    <div className="flex items-center space-x-2 mt-1">
                        <input type="datetime-local" value={reminderInput} onChange={e => setReminderInput(e.target.value)} className="input-field" />
                        <button type="button" onClick={addReminder} className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-sm font-medium rounded-md hover:bg-gray-300">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {formState.reminders?.sort((a,b) => new Date(a).getTime() - new Date(b).getTime()).map(isoString => (
                            <div key={isoString} className="bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-sm font-mono font-medium pl-3 pr-2 py-1 rounded-full flex items-center">
                                {formatDate(isoString)}
                                <button type="button" onClick={() => removeReminder(isoString)} className="ml-2 text-teal-600 dark:text-teal-300 hover:text-teal-800 dark:hover:text-teal-100">&times;</button>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium">Notes</label>
                    <textarea name="notes" value={formState.notes || ''} onChange={handleChange} rows={3} className="mt-1 input-field" placeholder="e.g., Take with a full glass of water"></textarea>
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
}

export default Medications;
