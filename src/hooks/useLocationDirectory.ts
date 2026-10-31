import { useEffect, useState } from 'react';
import locationDirectoryUrl from '../data/indiaLocationDirectory.json?url';

export interface LocationCity {
  geonameId: string;
  name: string;
  slug: string;
  district: string;
  districtSlug: string;
  population: number;
  featureCode: string;
  source: string;
}

export interface LocationDistrict {
  name: string;
  slug: string;
  admin2Code: string;
  cities: string[];
}

export interface LocationState {
  name: string;
  slug: string;
  admin1Code: string;
  districts: LocationDistrict[];
  cities: LocationCity[];
}

export interface LocationDirectory {
  source: {
    name: string;
    url: string;
    dataset: string;
    license: string;
    downloadedAt: string;
    coverage: string;
  };
  states: LocationState[];
}

let directoryRequest: Promise<LocationDirectory> | undefined;

export const loadLocationDirectory = () => {
  if (!directoryRequest) {
    directoryRequest = fetch(locationDirectoryUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Could not load the location directory (HTTP ${response.status}).`);
        }
        return response.json() as Promise<LocationDirectory>;
      })
      .catch(error => {
        directoryRequest = undefined;
        throw error;
      });
  }
  return directoryRequest;
};

export const useLocationDirectory = () => {
  const [directory, setDirectory] = useState<LocationDirectory>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    loadLocationDirectory().then(
      data => {
        if (active) setDirectory(data);
      },
      loadError => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load the location directory.');
      }
    );
    return () => {
      active = false;
    };
  }, []);

  return { directory, error };
};
