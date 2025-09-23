import React, { useState } from 'react';
import { getHealthInsights } from '../services/geminiService';
import { AIInsightData } from '../types';
import { LoadingSpinner, SparklesIcon } from './Icons';

interface FormState {
    heartRate: string;
    bloodPressure: string;
    activityType: string;
    notes: string;
    activityHours: string;
    activityMinutes: string;
    sleepHrs: string;
    sleepMins: string;
}

type FormFields = keyof FormState;

const AIInsights: React.FC = () => {
  const [formState, setFormState] = useState<FormState>({
    heartRate: '',
    bloodPressure: '',
    activityType: '',
    activityHours: '',
    activityMinutes: '',
    sleepHrs: '',
    sleepMins: '',
    notes: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [insights, setInsights] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<FormFields, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FormFields, boolean>>>({});

  const validateField = (name: FormFields, value: string): string | null => {
    if (!value) return null; // Don't validate empty optional fields

    switch (name) {
      case 'heartRate':
        if (isNaN(Number(value)) || Number(value) <= 20 || Number(value) >= 250) {
          return 'Please enter a realistic heart rate (20-250 bpm).';
        }
        break;
      case 'bloodPressure':
        if (!/^\d{2,3}\/\d{2,3}$/.test(value)) {
          return 'Use format "Sys/Dia" (e.g., 120/80).';
        }
        break;
      case 'activityHours':
         if (isNaN(Number(value)) || Number(value) < 0) {
          return 'Must be a positive number.';
        }
        break;
      case 'activityMinutes':
         if (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 59) {
          return 'Must be between 0-59.';
        }
        break;
      case 'sleepHrs':
         if (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 24) {
          return 'Must be between 0-24.';
        }
        break;
      case 'sleepMins':
         if (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 59) {
          return 'Must be between 0-59.';
        }
        break;
      default:
        break;
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as { name: FormFields; value: string };
    setFormState(prev => ({ ...prev, [name]: value }));

    // If field has been touched, provide real-time feedback as user types
    if (touched[name]) {
      const error = validateField(name, value);
      setFormErrors(prev => ({ ...prev, [name]: error ?? undefined }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as { name: FormFields; value: string };
    // Mark the field as touched when the user moves away from it
    setTouched(prev => ({ ...prev, [name]: true }));
    // Validate the field
    const error = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: error ?? undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<FormFields, string>> = {};
    let isValid = true;
    (Object.keys(formState) as Array<FormFields>).forEach(key => {
        const error = validateField(key, formState[key]);
        if (error) {
            newErrors[key] = error;
            isValid = false;
        }
    });
    setFormErrors(newErrors);
    // Mark all fields as touched to display errors on submit attempt
    const allTouched = (Object.keys(formState) as Array<FormFields>).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Partial<Record<FormFields, boolean>>);
    setTouched(allTouched);

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
        return;
    }

    setIsLoading(true);
    setApiError(null);
    setInsights(null);

    const { activityHours, activityMinutes, sleepHrs, sleepMins, ...rest } = formState;

    const totalActivityMinutes = (Number(activityHours) || 0) * 60 + (Number(activityMinutes) || 0);
    const totalSleepHours = (Number(sleepHrs) || 0) + ((Number(sleepMins) || 0) / 60);

    const insightData: AIInsightData = {
      ...rest,
      activityDuration: totalActivityMinutes > 0 ? String(totalActivityMinutes) : '',
      sleepHours: totalSleepHours > 0 ? totalSleepHours.toFixed(2) : '',
    };

    try {
      const result = await getHealthInsights(insightData);
      setInsights(result);
    } catch (err) {
      setApiError('Failed to generate insights. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formattedInsights = (text: string | null) => {
    if (!text) return null;
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">AI Health Insights</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Enter your recent health metrics to get a personalized wellness analysis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Your Daily Metrics</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Resting Heart Rate (bpm)</label>
                    <input type="text" inputMode="numeric" name="heartRate" value={formState.heartRate} onChange={handleChange} onBlur={handleBlur} className={`mt-1 input-field ${touched.heartRate && formErrors.heartRate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`} />
                    {touched.heartRate && formErrors.heartRate && <p className="text-red-500 text-xs mt-1">{formErrors.heartRate}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium">Blood Pressure (Sys/Dia)</label>
                    <input type="text" name="bloodPressure" placeholder="e.g., 120/80" value={formState.bloodPressure} onChange={handleChange} onBlur={handleBlur} className={`mt-1 input-field ${touched.bloodPressure && formErrors.bloodPressure ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`} />
                     {touched.bloodPressure && formErrors.bloodPressure && <p className="text-red-500 text-xs mt-1">{formErrors.bloodPressure}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium">Activity</label>
                    <input type="text" name="activityType" placeholder="e.g., Brisk Walking" value={formState.activityType} onChange={handleChange} onBlur={handleBlur} className="mt-1 input-field" />
                </div>
                <div>
                    <label className="block text-sm font-medium">Activity Duration</label>
                    <div className="flex items-start gap-2 mt-1">
                        <div className="flex-1">
                            <div className="relative">
                                <input type="number" name="activityHours" value={formState.activityHours} onChange={handleChange} onBlur={handleBlur} min="0" className={`input-field pr-10 ${touched.activityHours && formErrors.activityHours ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`} placeholder="hr" />
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-500 dark:text-gray-400">hr</span>
                            </div>
                            {touched.activityHours && formErrors.activityHours && <p className="text-red-500 text-xs mt-1">{formErrors.activityHours}</p>}
                        </div>
                        <div className="flex-1">
                           <div className="relative">
                                <input type="number" name="activityMinutes" value={formState.activityMinutes} onChange={handleChange} onBlur={handleBlur} min="0" max="59" className={`input-field pr-12 ${touched.activityMinutes && formErrors.activityMinutes ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`} placeholder="min" />
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-500 dark:text-gray-400">min</span>
                            </div>
                            {touched.activityMinutes && formErrors.activityMinutes && <p className="text-red-500 text-xs mt-1">{formErrors.activityMinutes}</p>}
                        </div>
                    </div>
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Hours of Sleep</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                 <div className="flex-1">
                    <div className="relative">
                        <input type="number" name="sleepHrs" value={formState.sleepHrs} onChange={handleChange} onBlur={handleBlur} min="0" max="24" className={`input-field pr-10 ${touched.sleepHrs && formErrors.sleepHrs ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`} placeholder="hr" />
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-500 dark:text-gray-400">hr</span>
                    </div>
                    {touched.sleepHrs && formErrors.sleepHrs && <p className="text-red-500 text-xs mt-1">{formErrors.sleepHrs}</p>}
                </div>
                <div className="flex-1">
                    <div className="relative">
                        <input type="number" name="sleepMins" value={formState.sleepMins} onChange={handleChange} onBlur={handleBlur} min="0" max="59" className={`input-field pr-12 ${touched.sleepMins && formErrors.sleepMins ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`} placeholder="min" />
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-500 dark:text-gray-400">min</span>
                    </div>
                    {touched.sleepMins && formErrors.sleepMins && <p className="text-red-500 text-xs mt-1">{formErrors.sleepMins}</p>}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">General Notes / How are you feeling?</label>
              <textarea name="notes" value={formState.notes} onChange={handleChange} onBlur={handleBlur} rows={3} className="mt-1 input-field"></textarea>
            </div>

            <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-teal-300">
              {isLoading ? <LoadingSpinner size={6} /> : <><SparklesIcon /> <span className="ml-2">Generate Insights</span></>}
            </button>
          </form>
        </div>

        {/* Results Section */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4">Your Analysis</h2>
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <LoadingSpinner size={12} />
                <p className="mt-4 text-gray-600 dark:text-gray-400">Analyzing your data... This may take a moment.</p>
              </div>
            )}
            {apiError && <p className="text-red-500">{apiError}</p>}
            {insights && (
              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed"
                   dangerouslySetInnerHTML={{ __html: formattedInsights(insights) || ''}} />
            )}
            {!isLoading && !insights && !apiError && (
                <div className="text-center text-gray-500 dark:text-gray-400 h-full flex flex-col justify-center items-center">
                    <SparklesIcon/>
                    <p className="mt-2">Your AI-powered insights will appear here.</p>
                </div>
            )}
        </div>
      </div>
       <style>{`
          .input-field {
            display: block;
            width: 100%;
            border-radius: 0.375rem;
            border-width: 1px;
            border-color: #D1D5DB; /* gray-300 */
            padding: 0.5rem 0.75rem;
            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          }
          .dark .input-field {
            background-color: #334155; /* slate-700 */
            border-color: #475569; /* slate-600 */
            color: #E2E8F0; /* slate-200 */
          }
           .dark .input-field::placeholder {
            color: #94A3B8; /* slate-400 */
          }
          .input-field:focus {
            outline: 2px solid transparent;
            outline-offset: 2px;
            border-color: #14B8A6; /* teal-500 */
            --tw-ring-color: #14B8A6; /* teal-500 */
            box-shadow: 0 0 0 1px #14B8A6;
          }
          input[type="number"]::-webkit-inner-spin-button,
          input[type="number"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type="number"] {
            -moz-appearance: textfield;
          }
      `}</style>
    </div>
  );
};

export default AIInsights;
