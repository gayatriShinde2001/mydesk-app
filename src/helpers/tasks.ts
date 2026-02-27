export const getRemindAtTimestamp = (option: string): EpochTimeStamp => {
    const now = new Date();
    switch (option) {
        case "5min":
            return new Date(now.getTime() + 5 * 60 * 1000).getTime()
        case "30min":
            return new Date(now.getTime() + 30 * 60 * 1000).getTime();
        case "tomorrow9am": {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0);
            return tomorrow.getTime();
        }
    }
};