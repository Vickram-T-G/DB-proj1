// Utility functions for date formatting in Indian format (dd/mm/yyyy)

export const formatIndianDate = (date) => {
  if (!date) return "Invalid date";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid date";

  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

export const formatIndianDateTime = (date) => {
  if (!date) return "Invalid date";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid date";

  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export const parseIndianDate = (dateString) => {
  if (!dateString) return null;

  // Handle dd/mm/yyyy format
  const parts = dateString.split("/");
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Month is 0-indexed
    const year = parseInt(parts[2]);

    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
};
