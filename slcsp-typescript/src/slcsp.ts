import { readCSV, printCSV } from './csvHelper';

const CWD = process.cwd();

enum MetalLevel {
  Bronze = 'Bronze',
  Silver = 'Silver',
  Gold = 'Gold',
  Platinum = 'Platinum',
  Catastrophic = 'Catastrophic'
}

// Plan as defined in CSV data
type PlanCSV = {
  state: string,
  metal_level: MetalLevel,
  rate: string,
  rate_area: string
}

type Plan = {
  metal_level: MetalLevel
  rate: number,
  tuple: string
}

// Zip as defined in CSV data
type ZipCSV = { 
  zipcode: string,
  state: string,
  rate_area: string
}

type Zip = {
  zipcode: string,
  tuple: string
}

// Second lowest costs silver plan
type SLCSP = {
  zipcode: string,
  rate: string
}


/*
* Calculate and print SLCSP for given Zip Codes
*/
export async function printSLCSP() {
    try {
      // Load given zip codes
      const slcsps = await readCSV<SLCSP, SLCSP>(CWD + '/slcsp.csv');

      // Load zip code data
      const zipsRequested = new Set<string>(slcsps.map(slcsp => slcsp.zipcode));
      const requestedZipRows = await readCSV<ZipCSV, Zip>(CWD + '/zips.csv', {
        transform: (zip: ZipCSV) => ({ zipcode: zip.zipcode, tuple: zip.state + zip.rate_area }),
        validate: (zip: Zip) => zipsRequested.has(zip.zipcode),
      });


      /*
      * Analyze zips for mappable values
      */ 

      // Store tuples by zip code OR NULL where ambiguous
      // {
      //   '97214': 'OR10'
      // } 
      const zipRateAreaDict: { [key: string]: string | null } = {};

      requestedZipRows.forEach((zip: Zip) => {
        if (zipRateAreaDict.hasOwnProperty(zip.zipcode) && zipRateAreaDict[zip.zipcode] !== zip.tuple) {
          // zip already added with different rate area (in multiple), mark zip as NULL (ambiguous)
          zipRateAreaDict[zip.zipcode] = null;
        } else {
          zipRateAreaDict[zip.zipcode] = zip.tuple;
        }
      })

      const mappableTuples = new Set(Object.values(zipRateAreaDict).filter(Boolean));

      // Load only needed plans
      const plans = await readCSV<PlanCSV, Plan>(CWD + '/plans.csv', {
        transform: (plan: PlanCSV) => {
          return { 
            metal_level: plan.metal_level,
            tuple: plan.state + plan.rate_area,
            rate: parseFloat(plan.rate) 
          }
        },
        validate: (plan: Plan) => plan.metal_level === MetalLevel.Silver && mappableTuples.has(plan.tuple)
      });
      
      // Group plan rates by rate area tuple
      const planRatesByTuple: { [key: string]: Set<number> } = plans.reduce((group, curr) => {
        group[curr.tuple] = (group[curr.tuple] || new Set()).add(curr.rate);

        return group;
      }, {} as { [key: string]: Set<number> });

      // Fill in rates for requested zip codes
      const results = slcsps.map((slcsp) => {
        const mappableTuple = zipRateAreaDict[slcsp.zipcode];

        // Fill zip if mappable and SLCSP can be determined
        if (mappableTuple && planRatesByTuple[mappableTuple]) {
          const rates = planRatesByTuple[mappableTuple];
          
          if (rates.size > 1) {
            const sortedRates = [...rates].sort();
            slcsp.rate = sortedRates[1].toFixed(2);
          }
        }

        return slcsp;
      })

      printCSV(results);
    } catch (e: unknown) {
      console.error(e);
    }
}
