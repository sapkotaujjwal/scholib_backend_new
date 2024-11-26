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

    b1.paymentHistory.forEach((elem)=>{
      totalAmt = totalAmt - elem.amount;
    })

    return totalAmt;
  }

  function busFeeCalculator(
    date = getDate().fullDate,
    dataArray,
    priceArray,
    date2 = "2080-01-01"
  ) {
    const getDaysDifference = (date2, date1) => {
      const oneDay = 24 * 60 * 60 * 1000;

      const firstDate = new Date(date1);
      const secondDate = new Date(date2);

      firstDate.setHours(0, 0, 0, 0);
      secondDate.setHours(0, 0, 0, 0);

      const timeDifference = firstDate.getTime() - secondDate.getTime();
      const daysDifference = Math.round(timeDifference / oneDay);

      return daysDifference;
    };

    let totalPrice = 0;

    dataArray.forEach((dataItem) => {
      const { place, start, end } = dataItem;
      const priceItem = priceArray.find((item) => item._id === place);

      if (priceItem) {
        const { amounts } = priceItem;
        let startDate = new Date(start);

        if (getDaysDifference(startDate, date2) > 0) {
          startDate = date2;
        }

        let endDate = end ? new Date(end) : new Date(date);

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