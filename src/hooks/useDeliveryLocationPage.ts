import { useEffect, useState } from 'react';
import { loadLocationDirectory } from './useLocationDirectory';

interface DeliveryLocation {
  city: string;
  state: string;
  serviceable: boolean;
  verified?: boolean;
}

interface LocationPageLink {
  key: string;
  to: string;
  city: string;
}

const normalize = (value: string) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

export const useDeliveryLocationPage = (delivery: DeliveryLocation | null): LocationPageLink | null => {
  const [resolvedLocation, setResolvedLocation] = useState<LocationPageLink | null>(null);
  const cityName = normalize(delivery?.city || '');
  const stateName = normalize(delivery?.state || '');
  const key = delivery?.verified && delivery.serviceable && cityName && stateName
    ? `${stateName}:${cityName}`
    : '';

  useEffect(() => {
    let active = true;

    if (!key || /^(unknown|city not verified)$/.test(cityName)) return;

    loadLocationDirectory().then(directory => {
      if (!active) return;

      const stateMatches = directory.states.filter(state =>
        normalize(state.name) === stateName || normalize(state.slug) === stateName
      );
      const statesToSearch = stateMatches.length ? stateMatches : directory.states;
      const cityMatches = statesToSearch.flatMap(state =>
        state.cities
          .filter(city => normalize(city.name) === cityName)
          .map(city => ({ state, city }))
      );

      if (cityMatches.length === 1) {
        const { state, city } = cityMatches[0];
        setResolvedLocation({
          key,
          to: `/locations/${state.slug}/${city.slug}`,
          city: city.name
        });
        return;
      }

      if (cityMatches.length > 1) return;

      const districtMatches = statesToSearch.flatMap(state =>
        state.districts
          .filter(district => normalize(district.name) === cityName)
          .map(district => ({ state, district }))
      );
      if (districtMatches.length === 1) {
        const { state, district } = districtMatches[0];
        setResolvedLocation({
          key,
          to: `/locations/${state.slug}/districts/${district.slug}`,
          city: delivery.city
        });
      }
    }).catch(error => {
      console.error('Could not match the verified delivery location to a location page:', error);
    });

    return () => {
      active = false;
    };
  }, [cityName, delivery?.city, key, stateName]);

  return resolvedLocation?.key === key ? resolvedLocation : null;
};
