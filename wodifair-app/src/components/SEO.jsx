import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, keywords, image, url }) => {
  const siteTitle = 'Wodifair - Luxury Exhibition & Trade Fair';
  const defaultDescription = 'Wodifair is a premier luxury exhibition and trade fair connecting premium brands with elite customers in Abuja, Port Harcourt, and Lagos.';
  const defaultKeywords = 'trade fair, luxury exhibition, abuja events, lagos events, premium brands';
  const defaultImage = '/images/seo-default.jpg'; // We should probably ensure this exists or use a logo
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://wodibenuahfair.com';

  const fullTitle = title ? `${title} | Wodifair` : siteTitle;
  const metaDescription = description || defaultDescription;
  const metaKeywords = keywords || defaultKeywords;
  const metaImage = image ? `${siteUrl}${image}` : `${siteUrl}${defaultImage}`;
  const metaUrl = url ? `${siteUrl}${url}` : siteUrl;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <link rel="canonical" href={metaUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={metaUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={metaDescription} />
      <meta property="twitter:image" content={metaImage} />
    </Helmet>
  );
};

export default SEO;
