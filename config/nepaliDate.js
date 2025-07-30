

function getDate() {
  try {
    const utcDate = new Date();

    const date = {
      fullDate: utcDate,
      year: utcDate.getFullYear(),
    };

    return date;
  } catch (error) {
    throw error;
  }
}

function isSameDay(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

module.exports = {  getDate, isSameDay };
