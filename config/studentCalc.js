const { getDate } = require("./nepaliDate");
const NepaliDate = require("nepali-date");

// a="thatClassFee", b="school.busFee", c="student.session[0]", d='classStartDate'

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
      // Helper function to convert a Nepali date string to an AD date
      const convertNepaliToAD = (nepaliDateString) => {
        const nepaliDate = new NepaliDate(nepaliDateString);

        return nepaliDate.getEnglishDate(); // Returns a Date object
      };

      // Convert both Nepali dates to AD
      const adDate1 = convertNepaliToAD(date1);
      const adDate2 = convertNepaliToAD(date2);

      // Calculate the difference in milliseconds
      const differenceInMilliseconds = adDate1 - adDate2;

      // Convert milliseconds to days
      const differenceInDays = Math.floor(
        differenceInMilliseconds / (1000 * 60 * 60 * 24)
      );

      return differenceInDays;
    };

    let totalPrice = 0;

    dataArray.forEach((dataItem) => {
      const { place, start, end } = dataItem;
      const priceItem = priceArray.find(
        (item) => item._id.toString() === place
      );

      if (priceItem) {
        const { amounts } = priceItem;
        let startDate = start;

        // Adjust startDate if it's earlier than date2
        if (getDaysDifference(startDate, date2) > 0) {
          startDate = date2;
        }

        let endDate = end ? end : date; // Use provided end date or default to "date"

        amounts.forEach((each, index) => {
          const currentAmountStart = each.date;
          const nextAmountStart = amounts[index + 1]
            ? amounts[index + 1].date
            : null;

          // Determine the effective start and end for the current amount bracket
          const effectiveStart =
            currentAmountStart > startDate ? currentAmountStart : startDate;
          const effectiveEnd =
            nextAmountStart && nextAmountStart < endDate
              ? nextAmountStart
              : endDate;

          // Calculate days only within the specific bracket
          const interval = getDaysDifference(effectiveStart, effectiveEnd);

          if (interval > 0) {
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
