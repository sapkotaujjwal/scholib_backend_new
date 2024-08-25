// ************ Here i am working here Nepali date soon i want it to be changed to UTC date and remove this comment ******************

const { adToBs } = require("@sbmdkl/nepali-date-converter");

function getCurrentNepaliDate() {
  try {
    const utcDate = new Date();
    const nepalTime = new Date(utcDate.getTime() + (5 * 60 + 45) * 60000);

    const formattedNepalDate = nepalTime.toISOString().split("T")[0];

    const nepaliDateStr = adToBs(formattedNepalDate);

    const nepaliYear = parseInt(nepaliDateStr.split("-")[0]);

    const nepaliTime = `${String(nepalTime.getUTCHours()).padStart(
      2,
      "0"
    )}:${String(nepalTime.getUTCMinutes()).padStart(2, "0")}:${String(
      nepalTime.getUTCSeconds()
    ).padStart(2, "0")}`;

    const nepaliHour = nepalTime.getUTCHours();

    const result = {
      nepaliDate: nepaliDateStr,
      nepaliYear,
      nepaliTime,
      nepaliHour,
    };

    return result;
  } catch (error) {
    throw error;
  }
}

function getDate() {
  try {
    const utcDate = new Date();
    const nepalTime = new Date(utcDate.getTime() + (5 * 60 + 45) * 60000);

    const formattedNepalDate = nepalTime.toISOString().split("T")[0];
    const nepaliDateStr = adToBs(formattedNepalDate);

    const nepaliYear = parseInt(nepaliDateStr.split("-")[0]);

    const date = {
      fullDate: nepaliDateStr,
      year: nepaliYear,
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

module.exports = { getCurrentNepaliDate, getDate, isSameDay };
