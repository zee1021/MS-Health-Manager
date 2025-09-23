
import React from 'react';
import { Tab, Appointment, Medication, Task } from '../types';
import { CalendarIcon, PillIcon, CheckCircleIcon, SparklesIcon, ChevronRightIcon } from './Icons';
import { formatDateShort } from '../utils/dateUtils';

interface DashboardProps {
  setActiveTab: (tab: Tab) => void;
  appointments: Appointment[];
  medications: Medication[];
  tasks: Task[];
  userName: string;
}

interface InfoCardProps {
  title: string;
  count: number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, count, subtitle, icon, color, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
  >
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
      <div className="text-right">
        <p className="text-4xl font-bold text-gray-800 dark:text-white">{count}</p>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      </div>
    </div>
    <div className="mt-4 flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
      <span>{subtitle}</span>
      <ChevronRightIcon />
    </div>
  </div>
);


const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, appointments, medications, tasks, userName }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingAppointments = appointments.filter(a => new Date(a.date) >= today);
  const todaysMedications = medications.filter(m => m.reminders.length > 0);
  const pendingTasks = tasks.filter(t => !t.isCompleted);
  
  const welcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{welcomeMessage()}, {userName}!</h1>
        <p className="mt-1 text-md text-gray-600 dark:text-gray-400">Here's your health summary for today, {formatDateShort(new Date().toISOString())}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <InfoCard
          title="Upcoming Appointments"
          count={upcomingAppointments.length}
          subtitle="View your schedule"
          icon={<CalendarIcon />}
          color="bg-blue-100 dark:bg-blue-900 text-blue-500 dark:text-blue-300"
          onClick={() => setActiveTab(Tab.Appointments)}
        />
        <InfoCard
          title="Medications Today"
          count={todaysMedications.length}
          subtitle="Check your regimen"
          icon={<PillIcon />}
          color="bg-purple-100 dark:bg-purple-900 text-purple-500 dark:text-purple-300"
          onClick={() => setActiveTab(Tab.Medications)}
        />
        <InfoCard
          title="Pending Tasks"
          count={pendingTasks.length}
          subtitle="Manage your to-dos"
          icon={<CheckCircleIcon />}
          color="bg-green-100 dark:bg-green-900 text-green-500 dark:text-green-300"
          onClick={() => setActiveTab(Tab.Tasks)}
        />
        <InfoCard
          title="AI Health Insights"
          count={0} // No count for AI
          subtitle="Get personalized analysis"
          icon={<SparklesIcon />}
          color="bg-yellow-100 dark:bg-yellow-900 text-yellow-500 dark:text-yellow-300"
          onClick={() => setActiveTab(Tab.AIInsights)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Appointment Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
            <h3 className="font-bold text-lg mb-4">Next Appointment</h3>
            {upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                    <p className="font-semibold text-teal-500 text-xl">{upcomingAppointments[0].type === 'Other' ? upcomingAppointments[0].customType : upcomingAppointments[0].type}</p>
                    <p className="text-gray-600 dark:text-gray-300">with {upcomingAppointments[0].provider}</p>
                    <p className="text-gray-600 dark:text-gray-300 font-mono">{new Date(upcomingAppointments[0].date).toLocaleString()}</p>
                </div>
            ) : (
                <p className="text-gray-500 dark:text-gray-400">No upcoming appointments scheduled.</p>
            )}
        </div>

        {/* Quick Tasks View */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
            <h3 className="font-bold text-lg mb-4">Your Top 3 Tasks</h3>
            {pendingTasks.length > 0 ? (
                <ul className="space-y-3">
                    {pendingTasks.slice(0, 3).map(task => (
                        <li key={task.id} className="flex items-center">
                            <div className="w-5 h-5 border-2 border-teal-500 rounded-full mr-3"></div>
                            <span>{task.title}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500 dark:text-gray-400">You've completed all your tasks!</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;