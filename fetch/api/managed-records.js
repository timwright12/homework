import URI from "urijs";

// /records endpoint
window.path = "http://localhost:3000/records";

const ITEMS_PER_PAGE = 10;
const PRIMARY_COLORS = ["red", "blue", "yellow"];

async function fetchData(options = {}) {
  const { page = 1, colors = [] } = options;
  const offset = (page - 1) * ITEMS_PER_PAGE;

  // Construct the URL with query parameters
  const uri = new URI(window.path);

  // Add pagination parameters
  uri.addQuery("limit", ITEMS_PER_PAGE + 1); // Request one extra item to determine if there's a next page
  uri.addQuery("offset", offset);

  // Add color filters if specified
  if (colors.length > 0) {
    colors.forEach((color) => uri.addQuery("color[]", color));
  }

  try {
    const response = await fetch(uri.toString());

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.log("Error retrieving records:", error.message);
    return null;
  }
}

function transformData(data, page) {
  if (!data) return null;

  // Check if we have more items than the page size
  const hasNextPage = data.length > ITEMS_PER_PAGE;
  // Trim the extra item we requested
  const pageData = data.slice(0, ITEMS_PER_PAGE);

  return {
    ids: pageData.map((item) => item.id),
    open: pageData
      .filter((item) => item.disposition === "open")
      .map((item) => ({
        ...item,
        isPrimary: PRIMARY_COLORS.includes(item.color),
      })),
    closedPrimaryCount: pageData.filter(
      (item) =>
        item.disposition === "closed" && PRIMARY_COLORS.includes(item.color)
    ).length,
    previousPage: page > 1 ? page - 1 : null,
    nextPage: hasNextPage ? page + 1 : null,
  };
}

// Entry point retrieve function
async function retrieve(options = {}) {
  // Step 1. Fetch data
  const rawData = await fetchData(options);
  // Step 2. Transform the data
  const transformedData = Promise.resolve(
    transformData(rawData, options.page || 1)
  );
  return transformedData;
}

export default retrieve;
