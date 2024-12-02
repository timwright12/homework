
const { parse } = require('csv-parse');
const { promises  } = require('fs');
async function parseCsvToJson(path) {
  const csvData = await promises.readFile(path);
  return await new Promise((resolve, reject) => {
    return parse(csvData, { columns: true }, (err, records) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(records);
      }
    });
  });
}

function getSecondCheapestSilverPlanByRateArea(plans) {
  const ratesByRateArea = plans.reduce((acc, next) => {
    if (next.metal_level != 'Silver') {
      return acc;
    }
    if (!acc[next.rate_area]) {
      acc[next.rate_area] = [];
    }
    acc[next.rate_area].push(parseFloat(next.rate));
    return acc;
  }, {});
  return Object.keys(ratesByRateArea).reduce((acc, next) => {
    const secondCheapest = getSecondMin(ratesByRateArea[next]);
    if (secondCheapest != Number.MAX_VALUE) {
      acc[next] = secondCheapest;
    }
    return acc;
  }, {});
}

function getSecondMin(prices) {
  const min = prices.reduce((acc, next) => {
    return next < acc ? next : acc;
  }, Number.MAX_VALUE);
  const minObj = prices.reduce((acc, next) => {
    const nextDif = next - min;
    if (nextDif > 0 && nextDif < acc.minDifference) {
      acc.minDifference = nextDif;
      acc.secondMin = next;
    }
    return acc;
  }, { secondMin: Number.MAX_VALUE, minDifference: Number.MAX_VALUE});
  return minObj.secondMin;
}

function getZipToRateAreaMapping(zipCodes) {
  const zipCodesSeen = new Set();
  return zipCodes.reduce((acc, next) => {
    if (!zipCodesSeen.has(next.zipcode)) {
      acc[next.zipcode] = next.rate_area;
      zipCodesSeen.add(next.zipcode);
    } else if (acc[next.zipcode] != next.rate_area) {
      delete acc[next.zipcode];
    }
    return acc;
  }, {});
}

function getSecondCheapestPlanForZip(slcsp, silverPlans, zipToAreaMap) {
  slcsp.forEach((slcspObj) => {
    if (zipToAreaMap[slcspObj.zipcode] && silverPlans[zipToAreaMap[slcspObj.zipcode]]) {
      const secondCheapest = silverPlans[zipToAreaMap[slcspObj.zipcode]];
      slcspObj.rate = secondCheapest.toFixed(2);
    }
  });
}

async function writeSecondCheapestPlansToCSV(slcsp) {
  console.log('zipcode, rate');
  const data = ['zipcode, rate', ...slcsp.map((slcspObj) => {
    const formattedString = `${slcspObj.zipcode}, ${slcspObj.rate}`;
    console.log(formattedString);
    return formattedString;
  })].join('\n');
  await promises.writeFile('./slcsp/slcsp-out.csv', data);
}
(async function main() {
  try {
    const [plans, slcsp, zipCodes] = await Promise.all([
      './slcsp/plans.csv',
      './slcsp/slcsp.csv',
      './slcsp/zips.csv'
    ].map((path) => parseCsvToJson(path)));
    const secondCheapest = getSecondCheapestSilverPlanByRateArea(plans);
    const zipToAreaMap = getZipToRateAreaMapping(zipCodes);
    getSecondCheapestPlanForZip(slcsp, secondCheapest, zipToAreaMap);
    writeSecondCheapestPlansToCSV(slcsp);
  } catch (err) {
    console.error(err);
  }
})();