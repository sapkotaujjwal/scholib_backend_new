const { getDate } = require("./nepaliDate");

function calculateStudentFee(a, b, c, d) {
  function findCourseFee(a1, b1) {
    let totalAmt = 0;

    a1.forEach((elem) => {
      totalAmt = totalAmt + elem.amount;
    });

    b1.fine.forEach((elem) => {
      totalAmt = totalAmt + elem.amount;
    });

    b1.discount.forEach((elem) => {
      totalAmt = totalAmt - elem.amount;
    });

    b1.paymentHistory.forEach((elem) => {
      totalAmt = totalAmt - elem.amount;
    });

    return totalAmt;
  }

  function busFeeCalculator(
    date = getDate().fullDate,
    dataArray,
    priceArray,
    date2 = "2080-01-01"
  ) {
    const getDaysDifference = (date2, date1) => {
      // Helper function to parse a date string
      const parseDate = (dateString) => {
        let splitString = dateString.includes("/") ? "/" : "-";

        let [year, month, day] = dateString.split(splitString).map(Number);

        // If the day is above 30, set it to 30
        if (day > 30) {
          day = 30;
        }

        return { year, month, day };
      };

      // Parse and normalize the dates
      const d1 = parseDate(date1);
      const d2 = parseDate(date2);

      // Convert everything into "days" assuming each month has 30 days
      const totalDays1 = d1.year * 360 + (d1.month - 1) * 30 + d1.day;
      const totalDays2 = d2.year * 360 + (d2.month - 1) * 30 + d2.day;

      // Calculate the difference in days
      const daysDifference = totalDays1 - totalDays2;

      return daysDifference;
    };

    let totalPrice = 0;

    dataArray.forEach((dataItem) => {
      const { place, start, end } = dataItem;
      const priceItem = priceArray.find((item) => item._id === place);

      if (priceItem) {
        const { amounts } = priceItem;
        let startDate = start;

        if (getDaysDifference(startDate, date2) > 0) {
          startDate = date2;
        }

        let endDate = end ? end : date;

        amounts.forEach((each) => {
          let daysdif = getDaysDifference(each.date, endDate);

          if (daysdif > 0) {
            let interval = getDaysDifference(each.date, endDate);
            let interval2 = getDaysDifference(each.date, startDate);

            if (interval2 > 0) {
              interval = interval - interval2;
            }

            totalPrice += (each.amount / 30) * (interval + 1);
          }
        });
      }
    });

    return Math.ceil(totalPrice);
  }

  return (
    findCourseFee(a, c) +
    busFeeCalculator(getDate().fullDate, c.bus, b, d) +
    c.previousLeft
  );
}

module.exports = { calculateStudentFee };
