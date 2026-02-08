import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { apiRequest } from '../services/api';

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiRequest('/blog')
      .then(data => {
        const mappedPosts = data.map(post => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          date: new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          category: post.category,
          image: post.image_url
        }));
        setPosts(mappedPosts);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-deep-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center text-red-500">
        <p>Error loading blog posts: {error}</p>
      </div>
    );
  }

  const featuredPost = posts.length > 0 ? posts[0] : null;
  const gridPosts = posts.length > 0 ? posts.slice(1) : [];

  return (
    <div className="min-h-screen bg-cream text-deep-black font-body flex flex-col">
      {/* Title Banner */}
      <div className="w-full px-2 md:px-8 py-3 md:py-6 border-b border-deep-black">
        <div className="relative w-full max-w-[1920px] mx-auto overflow-hidden">
          <h1 className="w-full text-[14vw] leading-[0.9] font-heading font-medium tracking-tighter text-deep-black flex flex-nowrap justify-center items-center select-none whitespace-nowrap px-1">
            <span>BL</span>
            <span className="relative inline-block mx-[0.02em]">
               <div className="absolute inset-0 z-0 flex items-center justify-center">
                  <div className="mt-[0.1em] w-[80%] h-[80%] overflow-hidden rounded-full">
                   <img 
                     src="/images/IMG_3766.JPG.jpeg" 
                     alt="Blog"
                     className="w-full h-full object-cover grayscale"
                   />
                 </div>
              </div>
              <span className="relative z-10 text-deep-black mix-blend-multiply">O</span>
            </span>
            <span>G</span>
          </h1>
        </div>
      </div>

      <Navigation activeItem="Blog" />

      {/* Featured Article */}
      {featuredPost && (
        <div className="border-b border-deep-black">
          <div className="flex flex-col lg:flex-row min-h-[600px]">
            <div className="lg:w-[60%] relative min-h-[400px] lg:min-h-full border-b lg:border-b-0 lg:border-r border-deep-black group overflow-hidden">
              <img 
                src={featuredPost.image} 
                alt={featuredPost.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-black/80 via-transparent to-transparent group-hover:from-deep-black/60 transition-colors duration-500"></div>
              <div className="absolute bottom-0 left-0 p-8 md:p-12 text-white z-10">
                <span className="text-xs font-bold tracking-[0.2em] uppercase bg-gold text-deep-black px-4 py-2 mb-6 inline-block">Featured Story</span>
                <h2 className="text-4xl md:text-6xl font-heading font-bold leading-[0.9] mb-4 drop-shadow-lg">{featuredPost.title}</h2>
                <p className="text-cream/90 text-lg md:text-xl font-body max-w-xl border-l-2 border-gold pl-4">{featuredPost.excerpt}</p>
              </div>
            </div>
            <div className="lg:w-[40%] p-8 md:p-16 flex flex-col justify-center bg-white relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-[10rem] font-heading font-bold leading-none pointer-events-none select-none">
                01
              </div>
              <span className="text-gray-400 text-xs font-bold tracking-[0.2em] uppercase mb-6">Latest from the Editor</span>
              <h3 className="text-3xl md:text-4xl font-heading font-bold mb-8 leading-tight">{featuredPost.title}</h3>
              <p className="text-gray-600 mb-12 leading-relaxed text-lg line-clamp-4">
                {featuredPost.excerpt}
              </p>
              <button className="group flex items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] hover:text-gold transition-colors">
                <span className="border-b border-deep-black pb-1 group-hover:border-gold transition-colors">Read Full Article</span>
                <svg className="w-4 h-4 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article Grid */}
      <div className="w-full px-4 md:px-8 py-16 md:py-24">
        {gridPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16 max-w-[1920px] mx-auto">
            {gridPosts.map((post) => (
              <div key={post.id} className="group cursor-pointer flex flex-col h-full">
                <div className="aspect-[16/9] overflow-hidden border border-deep-black mb-6 relative">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white text-deep-black text-[10px] font-bold px-3 py-1 uppercase tracking-widest border border-deep-black">
                      {post.category}
                    </span>
                  </div>
                </div>
                
                <div className="flex-grow flex flex-col">
                  <div className="flex items-center gap-4 text-xs text-gray-500 uppercase tracking-wider mb-3">
                    <span>{post.date}</span>
                    <span className="w-8 h-[1px] bg-gray-300"></span>
                    <span>5 Min Read</span>
                  </div>
                  
                  <h3 className="text-2xl font-heading font-bold mb-3 group-hover:underline decoration-1 underline-offset-4 leading-tight">
                    {post.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-2">
                    {post.excerpt}
                  </p>
                  
                  <div className="mt-auto">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] group-hover:text-gold transition-colors flex items-center gap-2">
                      Read More
                      <svg className="w-3 h-3 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !featuredPost && <div className="text-center text-gray-500 italic">No blog posts found.</div>
        )}
        
        {/* Pagination / Load More */}
        {allGridPosts.length > visibleCount && (
          <div className="flex justify-center mt-16">
            <button 
              onClick={handleLoadMore}
              className="border border-deep-black px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-deep-black hover:text-white transition-all duration-300">
              Load More Articles
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Blog;
