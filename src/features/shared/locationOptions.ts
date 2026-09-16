const locationVisibleOptionLimit = 6000;
const defaultLocationCountryName = "India";

interface CountryRecord {
  isoCode: string;
  name: string;
}

interface StateRecord {
  countryCode: string;
  isoCode: string;
  name: string;
}

interface CityRecord {
  countryCode: string;
  name: string;
  stateCode: string;
}

let countryRecordsCache: CountryRecord[] | null = null;
let stateRecordsCache: StateRecord[] | null = null;
let cityRecordsCache: CityRecord[] | null = null;
let countryOptionsCache: string[] | null = null;
let locationModulePromise: Promise<typeof import("country-state-city")> | null =
  null;
const stateOptionsByCountryCache = new Map<string, string[]>();
const cityOptionsByScopeCache = new Map<string, string[]>();
const pincodeLocationCache = new Map<string, PincodeLocation | null>();

export interface PincodeLocation {
  city: string;
  country: string;
  state: string;
}

const pincodeLocationMap: Record<string, PincodeLocation> = {
  "110001": { city: "New Delhi", country: "India", state: "Delhi" },
  "302018": { city: "Jaipur", country: "India", state: "Rajasthan" },
  "380009": { city: "Ahmedabad", country: "India", state: "Gujarat" },
  "380015": { city: "Ahmedabad", country: "India", state: "Gujarat" },
  "380051": { city: "Ahmedabad", country: "India", state: "Gujarat" },
  "382110": { city: "Sanand", country: "India", state: "Gujarat" },
  "382213": { city: "Ahmedabad", country: "India", state: "Gujarat" },
  "382405": { city: "Ahmedabad", country: "India", state: "Gujarat" },
  "394185": { city: "Surat", country: "India", state: "Gujarat" },
  "395002": { city: "Surat", country: "India", state: "Gujarat" },
  "400051": { city: "Mumbai", country: "India", state: "Maharashtra" },
  "700091": { city: "Kolkata", country: "India", state: "West Bengal" },
};

interface IndiaPostPincodeResponse {
  PostOffice?: Array<{
    Country?: string;
    District?: string;
    Name?: string;
    State?: string;
  }> | null;
  Status?: string;
}

function sortUniqueOptions(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  ).sort((first, second) => first.localeCompare(second));
}

function normalizeLocationName(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function loadLocationModule() {
  locationModulePromise ??= import("country-state-city");

  return locationModulePromise;
}

async function loadCountryRecords() {
  countryRecordsCache ??= (await loadLocationModule()).Country.getAllCountries()
    .map((country) => ({
      isoCode: country.isoCode,
      name: country.name,
    }));

  return countryRecordsCache;
}

async function loadStateRecords() {
  stateRecordsCache ??= (await loadLocationModule()).State.getAllStates().map(
    (state) => ({
      countryCode: state.countryCode,
      isoCode: state.isoCode,
      name: state.name,
    }),
  );

  return stateRecordsCache;
}

async function loadCityRecords() {
  cityRecordsCache ??= (await loadLocationModule()).City.getAllCities().map(
    (city) => ({
      countryCode: city.countryCode,
      name: city.name,
      stateCode: city.stateCode,
    }),
  );

  return cityRecordsCache;
}

async function findCountryByName(countryName?: string) {
  const normalizedCountryName = normalizeLocationName(countryName);

  if (!normalizedCountryName) {
    return null;
  }

  return (
    (await loadCountryRecords()).find(
      (country) => normalizeLocationName(country.name) === normalizedCountryName,
    ) ?? null
  );
}

async function findStateByName(countryCode: string, stateName?: string) {
  const normalizedStateName = normalizeLocationName(stateName);

  if (!normalizedStateName) {
    return null;
  }

  return (
    (await loadStateRecords()).find(
      (state) =>
        state.countryCode === countryCode &&
        normalizeLocationName(state.name) === normalizedStateName,
    ) ?? null
  );
}

export async function loadLocationCountryOptions() {
  countryOptionsCache ??= sortUniqueOptions(
    (await loadCountryRecords()).map((country) => country.name),
  );

  return countryOptionsCache;
}

export async function loadLocationStateOptions(countryName?: string) {
  const country = await findCountryByName(countryName || defaultLocationCountryName);

  if (!country) {
    return [];
  }

  const cachedOptions = stateOptionsByCountryCache.get(country.isoCode);

  if (cachedOptions) {
    return cachedOptions;
  }

  const options = sortUniqueOptions(
    (await loadStateRecords())
      .filter((state) => state.countryCode === country.isoCode)
      .map((state) => state.name),
  );

  stateOptionsByCountryCache.set(country.isoCode, options);

  return options;
}

export async function loadLocationCityOptions(
  countryName?: string,
  stateName?: string,
) {
  const country = await findCountryByName(countryName || defaultLocationCountryName);
  const normalizedStateName = normalizeLocationName(stateName);
  const cacheKey = [
    country?.isoCode ?? "all-countries",
    normalizedStateName || "all-states",
  ].join(":");
  const cachedOptions = cityOptionsByScopeCache.get(cacheKey);

  if (cachedOptions) {
    return cachedOptions;
  }

  const cityRecords = await loadCityRecords();

  if (country) {
    const state = await findStateByName(country.isoCode, stateName);
    const options = sortUniqueOptions(
      cityRecords
        .filter(
          (city) =>
            city.countryCode === country.isoCode &&
            (!normalizedStateName || city.stateCode === state?.isoCode),
        )
        .map((city) => city.name),
    );

    cityOptionsByScopeCache.set(cacheKey, options);

    return options;
  }

  return [];
}

export function getLocationByPincode(pincode: string) {
  return pincodeLocationMap[pincode.trim()] ?? null;
}

export async function resolveLocationByPincode(pincode: string) {
  const normalizedPincode = pincode.trim();

  if (!/^\d{6}$/.test(normalizedPincode)) {
    return null;
  }

  const localLocation = getLocationByPincode(normalizedPincode);

  if (localLocation) {
    return localLocation;
  }

  if (pincodeLocationCache.has(normalizedPincode)) {
    return pincodeLocationCache.get(normalizedPincode) ?? null;
  }

  try {
    const response = await fetch(
      `https://api.postalpincode.in/pincode/${normalizedPincode}`,
    );

    if (!response.ok) {
      pincodeLocationCache.set(normalizedPincode, null);
      return null;
    }

    const payload = (await response.json()) as IndiaPostPincodeResponse[];
    const postOffice = payload
      .find((entry) => entry.Status === "Success" && entry.PostOffice?.length)
      ?.PostOffice?.[0];

    if (!postOffice?.District || !postOffice.State) {
      pincodeLocationCache.set(normalizedPincode, null);
      return null;
    }

    const location = {
      city: postOffice.District,
      country: postOffice.Country || defaultLocationCountryName,
      state: postOffice.State,
    };

    pincodeLocationCache.set(normalizedPincode, location);
    pincodeLocationMap[normalizedPincode] = location;

    return location;
  } catch {
    pincodeLocationCache.set(normalizedPincode, null);
    return null;
  }
}

export const locationSearchVisibleOptionLimit = locationVisibleOptionLimit;
