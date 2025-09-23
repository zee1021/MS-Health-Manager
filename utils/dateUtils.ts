import { Recurrence } from '../types';

export const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleString(undefined, options);
};

export const formatDateShort = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

export const formatTime = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
    };
    return new Date(dateString).toLocaleTimeString(undefined, options);
}


export const getNextRecurrenceDate = (currentDate: string, recurrence: Recurrence, weeklyDays?: number[], monthlyInterval?: number, dailyInterval?: number, yearlyInterval?: number): string => {
    const date = new Date(currentDate);
    switch (recurrence) {
        case Recurrence.Daily:
            date.setDate(date.getDate() + (dailyInterval || 1));
            break;
        case Recurrence.Weekly:
            if (weeklyDays && weeklyDays.length > 0) {
              const currentDay = date.getDay();
              let nextDay = -1;
              const sortedDays = [...weeklyDays].sort((a, b) => a - b);
              // Find the next scheduled day in the same week
              for (const day of sortedDays) {
                if (day > currentDay) {
                  nextDay = day;
                  break;
                }
              }
              if (nextDay !== -1) {
                // Next occurrence is in the same week
                date.setDate(date.getDate() + (nextDay - currentDay));
              } else {
                // Next occurrence is in the next week, find the first scheduled day
                const firstDayOfWeek = sortedDays[0];
                date.setDate(date.getDate() + (7 - currentDay + firstDayOfWeek));
              }
            } else {
              // Default weekly if no days are selected
              date.setDate(date.getDate() + 7);
            }
            break;
        case Recurrence.Monthly:
            date.setMonth(date.getMonth() + (monthlyInterval || 1));
            break;
        case Recurrence.Yearly:
            date.setFullYear(date.getFullYear() + (yearlyInterval || 1));
            break;
        default:
            return date.toISOString();
    }
    return date.toISOString();
};