import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { apiRequest } from '../services/api';

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    apiRequest(`/blog/${slug}`)
      .then(data => {
        setPost(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-deep-black"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center text-deep-black">
        <h2 className="text-3xl font-heading font-bold mb-4">Post Not Found</h2>
        <p className="mb-8 text-gray-600">The article you are looking for does not exist or has been removed.</p>
        <Link to="/blog" className="border border-deep-black px-8 py-3 uppercase text-xs font-bold tracking-widest hover:bg-deep-black hover:text-white transition-colors">
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-deep-black font-body flex flex-col">
      <Navigation activeItem="Blog" />

      <article>
        {/* Hero Section */}
        <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden border-b border-deep-black">
          <img 
            src={post.image_url} 
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 text-white max-w-5xl">
            <div className="flex items-center gap-4 mb-6">
              <span className="bg-gold text-deep-black text-[10px] font-bold px-3 py-1 uppercase tracking-widest">
                {post.category}
              </span>
              <span className="text-sm font-bold uppercase tracking-wider">
                {new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-heading font-bold leading-tight mb-6 drop-shadow-lg">
              {post.title}
            </h1>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-16 md:py-24">
          <div className="prose prose-lg prose-stone max-w-none font-body">
             {/* Render content with line breaks */}
            {post.content.split('\n').map((paragraph, index) => (
              paragraph.trim() && <p key={index} className="mb-6 leading-relaxed text-gray-800">{paragraph}</p>
            ))}
          </div>

          {/* Share / Tags / Navigation could go here */}
          <div className="mt-16 pt-8 border-t border-gray-200 flex justify-between items-center">
             <Link to="/blog" className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-gold transition-colors">
               <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
               Back to Blog
             </Link>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogPost;
