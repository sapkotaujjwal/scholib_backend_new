const { getDate } = require("./nepaliDate");

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
    date = new Date(),
    dataArray,
    priceArray,
    date2 = "2080-01-01"
  ) {
    const getDaysDifference = (date1, date2) => {
      // Convert to Date objects if passed as strings
      const d1 = new Date(date1);
      const d2 = new Date(date2);

      // Zero out the time part for both dates
      d1.setHours(0, 0, 0, 0);
      d2.setHours(0, 0, 0, 0);

      // Calculate difference in milliseconds and convert to days
      const msPerDay = 1000 * 60 * 60 * 24;
      return Math.floor((d2 - d1) / msPerDay);
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

        // Sort amounts by date first (ascending order)
        const sortedAmounts = amounts
          .slice()
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        sortedAmounts.forEach((each, index) => {
          const currentAmountStart = each.date;
          const nextAmountStart = sortedAmounts[index + 1]
            ? sortedAmounts[index + 1].date
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
            totalPrice += (each.amount / 30) * (interval > 0 ? interval : 1);
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
