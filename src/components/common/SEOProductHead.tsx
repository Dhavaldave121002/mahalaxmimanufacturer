import React, { useEffect } from 'react';
import { Product } from '../../types';

interface SEOProductHeadProps {
  product: Product;
  city?: string;
  state?: string;
}

export const SEOProductHead: React.FC<SEOProductHeadProps> = ({ product }) => {
  useEffect(() => {
    if (!product) return;

    const inquiryOnly = product.stock <= 0;
    const baseTitle = `${product.name} | Mahalaxmi Manufacturer`;
    const metaDesc = inquiryOnly
      ? `${product.shortDescription || product.description || product.name} Source-listed details may need confirmation. Contact us to verify current availability and price.`
      : `${product.shortDescription || product.description || product.name} Contact Mahalaxmi Manufacturer for product and order details.`;

    // 1. Update Document Title
    document.title = baseTitle;

    // Helper to set/update meta tag
    const setMeta = (attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to set/update link tag
    const setLink = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 2. Standard Meta Tags
    setMeta('name', 'description', metaDesc);
    const keywords = `${product.name}, ${product.categoryName}, ${product.subcategory}, Mahalaxmi Manufacturer`;
    setMeta('name', 'keywords', keywords);

    // 4. OpenGraph Tags for Social & WhatsApp Previews
    const canonicalUrl = `https://mahalaxmimanufacturer.com/product/${product.slug || product.id}`;
    setLink('canonical', canonicalUrl);
    setMeta('property', 'og:title', baseTitle);
    setMeta('property', 'og:description', metaDesc);
    setMeta('property', 'og:type', 'product');
    setMeta('property', 'og:url', canonicalUrl);
    if (product.images && product.images[0]) {
      setMeta('property', 'og:image', product.images[0]);
    }

    // 5. Schema.org JSON-LD Structured Data Injection
    const scriptId = 'product-schema-ldjson';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const lowestTierPrice = product.wholesaleTiers && product.wholesaleTiers.length > 0
      ? Math.min(...product.wholesaleTiers.map(t => t.pricePerUnit))
      : product.retailPrice;

    const schemaData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Product",
          "@id": `${canonicalUrl}#product`,
          "name": product.name,
          "image": product.images || [],
          "description": product.shortDescription || product.description || metaDesc,
          "sku": product.sku,
          ...(product.sku.startsWith('SRC-') ? {} : { "mpn": product.sku }),
          "brand": {
            "@type": "Brand",
            "name": "Mahalaxmi Enterprises"
          },
          "manufacturer": {
            "@type": "Organization",
            "name": "Mahalaxmi Manufacturer",
            "url": "https://mahalaxmimanufacturer.com"
          },
          ...(!inquiryOnly ? { "offers": {
            "@type": "AggregateOffer",
            "lowPrice": lowestTierPrice,
            "highPrice": product.mrp,
            "priceCurrency": "INR",
            "offerCount": (product.wholesaleTiers?.length || 1) + 1,
            "priceValidUntil": "2027-12-31",
            "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "itemCondition": "https://schema.org/NewCondition",
            "seller": {
              "@type": "Organization",
              "name": "Mahalaxmi Enterprises",
              "url": "https://mahalaxmimanufacturer.com"
            }
          } } : {}),
          ...(product.rating > 0 && product.reviewCount > 0 ? { "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": product.rating,
            "reviewCount": product.reviewCount,
            "bestRating": "5",
            "worstRating": "1"
          } } : {})
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${canonicalUrl}#breadcrumbs`,
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://mahalaxmimanufacturer.com/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Catalog",
              "item": "https://mahalaxmimanufacturer.com/catalog"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": product.categoryName || "Textiles",
              "item": `https://mahalaxmimanufacturer.com/category/${product.category}`
            },
            {
              "@type": "ListItem",
              "position": 4,
              "name": product.name,
              "item": canonicalUrl
            }
          ]
        }
      ]
    };

    scriptTag.text = JSON.stringify(schemaData);

    return () => {
      // Reset title to default on unmount
      document.title = 'Mahalaxmi Enterprises | Direct Mill Rates & Wholesale Essentials';
    };
  }, [product]);

  return null;
};
