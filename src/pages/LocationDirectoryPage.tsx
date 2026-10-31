import React, { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useLocationDirectory } from '../hooks/useLocationDirectory';

export const LocationDirectoryPage: React.FC = () => {
  const { stateSlug, districtSlug } = useParams<{ stateSlug?: string; districtSlug?: string }>();
  const { directory, error } = useLocationDirectory();
  const state = directory?.states.find(item => item.slug === stateSlug);
  const district = state?.districts.find(item => item.slug === districtSlug);
  const districtPlaces = district && state
    ? state.cities.filter(city => city.district === district.name && city.districtSlug === district.slug)
    : [];
  const popularPlaces = state
    ? [...state.cities].sort((a, b) => b.population - a.population).slice(0, 30)
    : [];
  const title = district
    ? `Products and delivery in ${district.name}, ${state?.name} | Mahalaxmi Enterprise`
    : state
      ? `Cotton, Textile & Home Products in ${state.name} | Mahalaxmi Enterprise`
      : 'India locations | Mahalaxmi Enterprise';
  const description = district
    ? `Browse towns and places in ${district.name}, ${state?.name}, and explore cotton, textile and home products. Check delivery serviceability by PIN code.`
    : state
      ? `Explore cotton, textile, home utility and kitchen products for delivery enquiries across ${state.name}. Browse districts and places, and check delivery serviceability by PIN code.`
      : 'Browse states, union territories, districts and towns across India. Explore Mahalaxmi Enterprise products and confirm delivery availability by PIN code.';
  const canonicalUrl = `https://mahalaxmimanufacturer.com${district
    ? `/locations/${state?.slug}/districts/${district.slug}`
    : state
      ? `/locations/${state.slug}`
      : '/locations'}`;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const meta = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = meta?.content;
    if (meta) meta.content = description;

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    const previousCanonical = canonical.href;
    canonical.href = canonicalUrl;

    const ogUrl = document.head.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    const previousOgUrl = ogUrl?.content;
    if (ogUrl) ogUrl.content = canonicalUrl;

    const ogTitle = document.head.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    const previousOgTitle = ogTitle?.content;
    if (ogTitle) ogTitle.content = title;

    const ogDescription = document.head.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    const previousOgDescription = ogDescription?.content;
    if (ogDescription) ogDescription.content = description;

    return () => {
      document.title = previousTitle;
      if (meta && previousDescription !== undefined) meta.content = previousDescription;
      if (canonical) canonical.href = previousCanonical;
      if (ogUrl && previousOgUrl !== undefined) ogUrl.content = previousOgUrl;
      if (ogTitle && previousOgTitle !== undefined) ogTitle.content = previousOgTitle;
      if (ogDescription && previousOgDescription !== undefined) ogDescription.content = previousOgDescription;
    };
  }, [canonicalUrl, description, title]);

  if (error) return <p role="alert" className="mx-auto my-12 max-w-3xl rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{error}</p>;
  if (!directory) return <div className="min-h-48" aria-label="Loading location directory" />;
  if (stateSlug && !state) return <Navigate to="/locations" replace />;
  if (districtSlug && !district) return <Navigate to={state ? `/locations/${state.slug}` : '/locations'} replace />;

  return (
    <div className="pb-16">
      <section className="bg-navy px-4 py-10 text-white sm:px-6 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <Link to="/" className="hover:text-white">Home</Link><span>/</span>
            <Link to="/locations" className="hover:text-white">India</Link>
            {state && <><span>/</span>{district ? <Link to={`/locations/${state.slug}`} className="hover:text-white">{state.name}</Link> : <span className="text-champagne">{state.name}</span>}</>}
            {district && <><span>/</span><span className="text-champagne">{district.name}</span></>}
          </nav>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
            {district ? `Products and delivery in ${district.name}` : state ? `Products and delivery across ${state.name}` : 'Explore locations across India'}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-200 sm:text-base">
            {description}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/catalog" className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-navy hover:bg-slate-100">Browse products</Link>
            <Link to="/wholesale" className="rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">Bulk enquiries</Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-4 pt-10 sm:px-6">
        {district ? (
          <section>
            <h2 className="text-2xl font-black text-navy">Towns and places in {district.name}</h2>
            <p className="mt-2 text-sm text-slate-600">Confirm delivery availability for your exact PIN code before ordering.</p>
            {districtPlaces.length ? (
              <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {districtPlaces.map(place => (
                  <li key={place.slug}>
                    <Link className="block rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-navy transition hover:border-indigo hover:text-indigo" to={`/locations/${state?.slug}/${place.slug}`}>
                      {place.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Contact us with your PIN code to confirm serviceability in this district.</p>
            )}
          </section>
        ) : state ? (
          <>
            <section>
              <h2 className="text-2xl font-black text-navy">Districts in {state.name}</h2>
              <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {state.districts.map(item => (
                  <li key={item.slug}>
                    <Link className="block rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-navy transition hover:border-indigo hover:text-indigo" to={`/locations/${state.slug}/districts/${item.slug}`}>
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="text-2xl font-black text-navy">Cities and towns</h2>
              <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {popularPlaces.map(place => (
                  <li key={place.slug}>
                    <Link className="block rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-navy transition hover:border-indigo hover:text-indigo" to={`/locations/${state.slug}/${place.slug}`}>
                      {place.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : (
          <section>
            <h2 className="text-2xl font-black text-navy">States and union territories</h2>
            <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {directory.states.map(item => (
                <li key={item.slug}>
                  <Link className="block rounded-xl border border-slate-200 bg-white p-4 text-sm font-bold text-navy transition hover:border-indigo hover:text-indigo" to={`/locations/${item.slug}`}>
                    {item.name}<span className="mt-1 block text-xs font-normal text-slate-500">{item.districts.length} districts · {item.cities.length} cities and towns</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-xs leading-5 text-slate-500">
          Place names are from <a className="underline" href={directory.source.url}>GeoNames</a> (CC BY 4.0). The directory includes places with population over 500 or administrative seats down to PPLA4, along with configured cities. It does not imply a local shop, branch or guaranteed delivery; verify by PIN code.
        </p>
      </div>
    </div>
  );
};
