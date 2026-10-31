import React, { useEffect, useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Building2, MapPin, Truck } from 'lucide-react';
import { ProductCard } from '../components/common/ProductCard';
import { useApp } from '../context/AppContext';
import locationData from '../data/locationPages.json';
import { useLocationDirectory } from '../hooks/useLocationDirectory';
import { productBelongsToCollection } from '../utils/productCategories';

const { services: serviceTypes } = locationData;

export const LocationPage: React.FC = () => {
  const { stateSlug, citySlug } = useParams<{ stateSlug: string; citySlug: string }>();
  const { directory, error } = useLocationDirectory();
  const state = directory?.states.find(item => item.slug === stateSlug);
  const place = state?.cities.find(item => item.slug === citySlug);
  const city = place?.name;
  const { products } = useApp();

  const featuredProducts = useMemo(() => {
    const categoryIds = new Set(serviceTypes.map(service => service.collection));
    return products
      .filter(product => Array.from(categoryIds).some(category => productBelongsToCollection(product, category)))
      .slice(0, 8);
  }, [products]);

  useEffect(() => {
    if (!city || !state || !place) return;

    const previousTitle = document.title;
    const title = `Cotton, Textile & Home Products in ${city} | Mahalaxmi Enterprise`;
    const districtLabel = place.district ? `, ${place.district}` : '';
    const description = `Explore cotton and fabric products, home utility, kitchen accessories, reusable bags and storage essentials for ${city}${districtLabel}, ${state.name}. Check current product details, delivery availability and bulk enquiry options.`;
    const canonicalUrl = `https://mahalaxmimanufacturer.com/locations/${state.slug}/${place.slug}`;
    document.title = title;

    const updateMeta = (selector: string, attribute: string, value: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      const previousContent = element?.content;
      if (!element) {
        element = document.createElement('meta');
        const [key, content] = attribute.split('=');
        element.setAttribute(key, content.replace(/['"]/g, ''));
        document.head.appendChild(element);
      }
      element.content = value;
      return () => {
        if (previousContent === undefined) element?.remove();
        else if (element) element.content = previousContent;
      };
    };

    const restoreMeta = [
      updateMeta('meta[name="description"]', 'name="description"', description),
      updateMeta('meta[name="keywords"]', 'name="keywords"', `textile products ${city}, cotton products supplier ${city}, home utility products ${city}, kitchen accessories ${city}, tote bags wholesale ${city}, reusable products ${city}, cotton manufacturing ${city}, storage solutions ${city}, ${state.name}`),
      updateMeta('meta[property="og:title"]', 'property="og:title"', title),
      updateMeta('meta[property="og:description"]', 'property="og:description"', description)
    ];

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    return () => {
      document.title = previousTitle;
      restoreMeta.forEach(restore => restore());
      const nextCanonical = `https://mahalaxmimanufacturer.com${window.location.pathname}`;
      if (canonical) canonical.href = nextCanonical;
      const ogUrl = document.head.querySelector<HTMLMetaElement>('meta[property="og:url"]');
      if (ogUrl) ogUrl.content = nextCanonical;
    };
  }, [city, place, state]);

  if (error) return <p role="alert" className="mx-auto my-12 max-w-3xl rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{error}</p>;
  if (!directory) return <div className="min-h-48" aria-label="Loading location details" />;
  if (!state || !place || !city) return <Navigate to="/" replace />;

  return (
    <div className="pb-16">
      <section className="relative overflow-hidden bg-navy px-4 py-12 text-white sm:px-6 sm:py-16">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#C6AA80_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-xs text-slate-300">
            <Link to="/" className="hover:text-white">Home</Link><span>/</span>
            <Link to="/catalog" className="hover:text-white">Products</Link><span>/</span>
            <Link to={`/locations/${state.slug}`} className="hover:text-white">{state.name}</Link>
            {place.district && <><span>/</span><Link to={`/locations/${state.slug}/districts/${place.districtSlug}`} className="hover:text-white">{place.district}</Link></>}
            <span>/</span><span className="text-champagne">{city}</span>
          </nav>
          <div className="max-w-3xl">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-champagne">
              <MapPin className="h-3.5 w-3.5" /> Serving customers across India
            </span>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
              Cotton, Textile &amp; Home Products for {city}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
              Explore Mahalaxmi Enterprise’s online range of cotton and fabric products, home utility essentials,
              kitchen accessories, reusable bags and storage solutions for buyers in {city}{place.district ? `, ${place.district}` : ''}, {state.name}.
              Product details and delivery availability are confirmed for your address before purchase.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/catalog" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-navy hover:bg-slate-100">
                Browse products <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/wholesale" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">
                Bulk and business enquiries <Building2 className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-4 pt-10 sm:px-6">
        <section>
          <div className="mb-5">
            <h2 className="text-2xl font-black text-navy">Products and business categories</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Find products for homes, retailers and business buyers in {city}. Select a category to see its current
              catalogue; listed products, prices and stock are subject to confirmation at the time of enquiry or order.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4 sm:gap-x-5 sm:gap-y-8 xl:grid-cols-7">
            {serviceTypes.map(service => (
              <Link
                key={service.title}
                to={service.href}
                className="group flex min-w-0 flex-col items-center text-center"
              >
                <div className="relative mb-3 aspect-square w-full max-w-40 shrink-0 rounded-full border border-dashed border-sky-300 bg-white p-1 sm:mb-3">
                  <img
                    src={service.image}
                    alt={`${service.title} products for ${city}`}
                    className="h-full w-full rounded-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <h3 className="flex min-h-10 items-center justify-center text-sm font-medium leading-5 text-navy group-hover:text-indigo sm:text-base">{service.title}</h3>
                <p className="mt-1 max-w-40 text-xs leading-4 text-slate-600">{service.detail}</p>
                <span className="sr-only">Explore {service.title}</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-navy">Featured products</h2>
              <p className="mt-1 text-sm text-slate-600">Browse current catalogue products for delivery enquiries in {city}.</p>
            </div>
            <Link to="/catalog" className="text-sm font-bold text-indigo hover:underline">View full catalogue</Link>
          </div>
          {featuredProducts.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
              {featuredProducts.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              The live product catalogue is loading. Visit the <Link to="/catalog" className="font-bold text-indigo underline">full catalogue</Link> to check current listings.
            </div>
          )}
        </section>

        <section className="grid gap-4 rounded-3xl bg-slate-50 p-6 sm:grid-cols-3 sm:p-8">
          <div className="flex gap-3"><Truck className="mt-1 h-5 w-5 shrink-0 text-indigo" /><div><h3 className="font-bold text-navy">Check delivery availability</h3><p className="mt-1 text-sm leading-5 text-slate-600">Enter your PIN code on the product or checkout page for delivery serviceability and estimates.</p></div></div>
          <div className="flex gap-3"><Building2 className="mt-1 h-5 w-5 shrink-0 text-indigo" /><div><h3 className="font-bold text-navy">Buying for a business?</h3><p className="mt-1 text-sm leading-5 text-slate-600">Share product, quantity and destination details through the wholesale enquiry page.</p></div></div>
          <div className="flex gap-3"><BadgeCheck className="mt-1 h-5 w-5 shrink-0 text-indigo" /><div><h3 className="font-bold text-navy">Confirm product details</h3><p className="mt-1 text-sm leading-5 text-slate-600">Check specifications, live availability and current prices on each product listing before ordering.</p></div></div>
        </section>

        <p className="text-xs leading-5 text-slate-500">
          Mahalaxmi Enterprise is an online product seller and manufacturer. This page helps customers in {city}, {state.name}
          discover the catalogue; it does not represent a local store, branch or city-specific stock guarantee.
        </p>
        <p className="text-xs text-slate-500">Place-name source: <a className="underline" href={directory.source.url}>GeoNames</a> (CC BY 4.0).</p>
      </div>
    </div>
  );
};
