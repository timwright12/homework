<?php
define("DEBUG", false);

# This will be an array of SilverPlans class using $sra (state + rate_area) as the key
$silver_plans = array();
$sras = array(); # This will be used to determine the $sra from the zip code

header('Content-Type: text/plain');

class SilverPlans {
    public $sra;
    public $rates = [];
    public $county_codes = [];
    public $zipcodes = array();
    function get_rates() {
        # Just used for debugging to ensure we're picking the correct rate

        $this->rates = array_unique($this->rates);

        # Now sort rates so that the $rates[1] element is the second lowest
        sort($this->rates, SORT_NUMERIC);

        return $this->rates;
    }
    function second_lowest() {
        # Remove duplicate values from relevant arrays
//        $this->county_codes = array_unique($this->county_codes);
//        $this->zipcodes = array_unique($this->zipcodes);
        $this->rates = array_unique($this->rates);

        # Now sort rates so that the $rates[1] element is the second lowest
        sort($this->rates, SORT_NUMERIC);

//        if (count($this->county_codes) > 1) {
//            if (DEBUG) {return "Ambiguous, too many county_codes for $this->sra";} else {return "";}
//        }
        if (count($this->rates) <= 1) {
            if (DEBUG) {return "Not enough rates to calculate SLCSP for $this->sra";} else {return "";}
        }

        return $this->rates[1];
    }
}

# load Plans file and populate rates by state+rate_area
# Headers: plan_id,state,metal_level,rate,rate_area
if (($handle = fopen("plans.csv", "r")) !== FALSE) { // Get handle on file
    $data = fgetcsv($handle, 1000, ","); # Get header row
    while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) { // Loop through lines
        $plan_id = $data[0];
        $state = $data[1];
        $metal_level = $data[2];
        $rate = $data[3];
        $rate_area = $data[4];

        #if (DEBUG) echo "Processing $plan_id\n";

        # Skip over anything that's not a Silver plan
        if ($metal_level == 'Silver') {
            $sra = "$state $rate_area";
            if (!array_key_exists($sra, $silver_plans)) {
                $silver_plans[$sra] = new SilverPlans();
                $silver_plans[$sra]->sra = $sra;
            }
            $silver_plans[$sra]->rates[] = $rate;
        }
    }
    fclose($handle);
}

# Load zips file
# Headers: zipcode,state,county_code,name,rate_area
if (($handle = fopen("zips.csv", "r")) !== FALSE) { // Get handle on file
    $data = fgetcsv($handle, 1000, ","); # Get header row
    while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) { // Loop through lines
        $zipcode = $data[0];
        $state = $data[1];
        $county_code = $data[2];
        $rate_area = $data[4];
        $sra = "$state $rate_area";

        $sras[$zipcode][] = $sra;

//        # Create a reference to look up $sra given $zipcode
//        if (array_key_exists($sra, $silver_plans)) {
//            # Add to $silver_plans object properties
////            $silver_plans[$sra]->zipcodes[] = $zipcode;
////            $silver_plans[$sra]->county_codes[] = $county_code;
//        } else {
//#            echo "No silver_plan for $sra \n";
//        }

    }
    fclose($handle);
}

# Load slcsp.csv
# Headers: zipcode,rate
if (($handle = fopen("slcsp.csv", "r")) !== FALSE) { // Get handle on file
    $data = fgetcsv($handle, 1000, ","); # Get header row and output
    echo "$data[0],$data[1]\n";
    while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) { // Loop through lines
        $zipcode = $data[0];
        echo "$zipcode,";

        # The line below de-duplicates the SRA list for each zip.
        # There are better ways to do this (like checking before insert), but this is easier
        $sras[$zipcode] = array_unique($sras[$zipcode]);

        if (count($sras[$zipcode]) > 1) { # Ambiguous, can't output rate
            if (DEBUG) {
                echo "zipcode in more than one SRA\n";
                #print_r($sras[$zipcode]);
            } else {echo "\n";};
        } elseif (!array_key_exists($sras[$zipcode][0], $silver_plans)) {
            # No rate area, can't output rate
            if (DEBUG) {
                echo "No silver plans found for ". $sras[$zipcode][0] ."\n";
            } else {echo "\n";};
        } else {
            #if (DEBUG) print_r($silver_plans[$sras[$zipcode][0]]->get_rates());
            echo $silver_plans[$sras[$zipcode][0]]->second_lowest() ."\n";
        }

    }
    fclose($handle);
}
