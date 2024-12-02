# SLCSP

## Calculate the second lowest cost silver plan

## Problem

Determine the second lowest cost silver plan (SLCSP) for
a group of ZIP codes.

## Implementation

This code was written in node.js. First, the implementation parses the csv files in the `slcsp` directory into json object arrays, this operation is done concurrently for all the files. Next, it extracts the silver plan information for each rate area. After this, it maps the zip code to a unique rate area, excluding the zip codes that map to multiple rate areas. Finally, it uses these two objects to extract the second lowest silver rate plan price, and writes this to a csv `slcsp-out.csv`. This was implemented to avoid overwriting the input file with the output data.

## optimizations
This code could be further optimized by allowing cli arguments for alternative directories where the .csv files are located.
### Compiling Source
In order to run the build the executable, first run 
```
npm i
```
in `slcsp` root directory. This will enable building the executable.

The package is compiled using the npm package `pkg`.
The executable slcsp-exe is generated when the command 
```
npm run generate
``` 
is run in a terminal.
