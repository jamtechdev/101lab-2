import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOMetaProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: 'website' | 'article' | 'product' | 'organization';
  url?: string;
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
  price?: string;
  currency?: string;
  availability?: string;
}

const SEOMeta = ({
  title = 'GreenBidz - Enterprise Asset Management & Marketplace',
  description = 'Professional B2B marketplace for buying and selling industrial equipment, machinery, and recyclable materials. Turn your surplus assets into value.',
  keywords = 'industrial equipment, machinery marketplace, asset management, buy equipment, sell surplus, recyclables, B2B marketplace',
  image = '/greenbidz_logo.png',
  type = 'website',
  url,
  author = 'GreenBidz',
  publishedDate,
  modifiedDate,
  price,
  currency,
  availability,
}: SEOMetaProps) => {
  const location = useLocation();
  const currentUrl = url || `https://101recycle.greenbidz.com${location.pathname}${location.search}`;
  const currentLanguage = localStorage.getItem('language') || 'en';

  // Multi-language support
  const langMap: { [key: string]: string } = {
    en: 'en_US',
    zh: 'zh_TW',
    ja: 'ja_JP',
    th: 'th_TH',
  };

  const ogLocale = langMap[currentLanguage] || 'en_US';

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <html lang={currentLanguage} />
      <meta charSet="UTF-8" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image.startsWith('http') ? image : `https://101recycle.greenbidz.com${image}`} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content="GreenBidz" />
      <meta property="og:locale" content={ogLocale} />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@GreenBidz" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image.startsWith('http') ? image : `https://101recycle.greenbidz.com${image}`} />

      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="language" content={currentLanguage} />

      {/* Product-specific Schema */}
      {type === 'product' && (
        <>
          <meta property="product:price:amount" content={price} />
          <meta property="product:price:currency" content={currency || 'USD'} />
          <meta property="product:availability" content={availability || 'in stock'} />
        </>
      )}

      {/* Article/Blog Meta Tags */}
      {(type === 'article') && (
        <>
          {publishedDate && <meta property="article:published_time" content={publishedDate} />}
          {modifiedDate && <meta property="article:modified_time" content={modifiedDate} />}
          <meta property="article:author" content={author} />
        </>
      )}

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': type === 'product' ? 'Product' : type === 'article' ? 'NewsArticle' : 'WebSite',
          name: title,
          description: description,
          image: image.startsWith('http') ? image : `https://101recycle.greenbidz.com${image}`,
          url: currentUrl,
          ...(type === 'website' && {
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://101recycle.greenbidz.com/buyer-marketplace?search={search_term_string}',
              },
              'query-input': 'required name=search_term_string',
            },
          }),
          ...(type === 'product' && {
            brand: {
              '@type': 'Brand',
              name: 'GreenBidz',
            },
            offers: {
              '@type': 'Offer',
              availability: `http://schema.org/${availability || 'InStock'}`,
              price: price,
              priceCurrency: currency || 'USD',
            },
          }),
          ...(type === 'article' && {
            author: {
              '@type': 'Organization',
              name: author,
            },
            ...(publishedDate && { datePublished: publishedDate }),
            ...(modifiedDate && { dateModified: modifiedDate }),
          }),
        })}
      </script>
    </Helmet>
  );
};

export default SEOMeta;
