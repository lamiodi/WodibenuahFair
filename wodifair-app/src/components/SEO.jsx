import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Wodibenuah Fair';
const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://wodibenuah-fair.vercel.app').replace(/\/$/, '');
const DEFAULT_TITLE = `${SITE_NAME} | Luxury Trade Fair in Lagos`;
const DEFAULT_DESCRIPTION =
  'Wodibenuah Fair is a luxury trade fair connecting premium brands with customers in Lagos through curated exhibitions, vendor showcases, and cultural experiences.';
const DEFAULT_KEYWORDS =
  'Wodibenuah Fair, Wodifair, trade fair Nigeria, Lagos exhibition, vendor registration, luxury fair';
const DEFAULT_IMAGE = 'https://res.cloudinary.com/dwmz4youk/image/upload/v1779310125/wodifair/Wodi_SM_17.png';

const toAbsoluteUrl = (value) => {
  if (!value) return `${SITE_URL}${DEFAULT_IMAGE}`;
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_URL}${value.startsWith('/') ? value : `/${value}`}`;
};

const normalizeUrl = (value = '/') => {
  if (/^https?:\/\//i.test(value)) return value;
  const path = value.startsWith('/') ? value : `/${value}`;
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
};

const SEO = ({
  title,
  description,
  keywords,
  image,
  url = '/',
  type = 'website',
  noindex = false,
  structuredData,
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const metaKeywords = keywords || DEFAULT_KEYWORDS;
  const metaImage = toAbsoluteUrl(image);
  const metaUrl = normalizeUrl(url);
  const robots = noindex ? 'noindex, nofollow' : 'index, follow';

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="author" content={SITE_NAME} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />
      <link rel="canonical" href={metaUrl} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_NG" />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {structuredData ? (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      ) : null}
    </Helmet>
  );
};

export default SEO;
