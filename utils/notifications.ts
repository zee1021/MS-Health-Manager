
export const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notification");
      return;
    }
  
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      await Notification.requestPermission();
    }
};

export const sendNotification = (title: string, options: NotificationOptions & { sound: boolean }) => {
    if (!("Notification" in window)) {
        console.error("This browser does not support desktop notification");
        return;
    }

    if (Notification.permission === "granted") {
        const notification = new Notification(title, options);
        if (options.sound) {
            const audio = new Audio('https://cdn.jsdelivr.net/npm/simple-notify@0.5.5/dist/audio/notification.mp3');
            audio.play().catch(e => console.error("Error playing sound:", e));
        }
    }
};
