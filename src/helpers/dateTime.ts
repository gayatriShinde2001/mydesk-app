export const formatDate = (dateStr: EpochTimeStamp) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString();
};