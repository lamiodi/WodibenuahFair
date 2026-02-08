import bcrypt from 'bcryptjs';
import pool from './db.js';

const seed = async () => {
  try {
    console.log('Seeding database...');

    // 1. Create Admin User
    const adminEmail = 'admin@wodibenuahfair.com';
    const adminPassword = 'Password123!';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Check if admin exists
    const adminCheck = await pool.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    if (adminCheck.rows.length === 0) {
      await pool.query(
        'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
        [adminEmail, hashedPassword, 'admin']
      );
      console.log(`Admin user created: ${adminEmail} / ${adminPassword}`);
    } else {
      console.log('Admin user already exists.');
    }

    // 2. Seed Vendors
    const vendors = [
        {
          full_name: "Luxe Atelier",
          email: "contact@luxeatelier.com",
          phone_number: "08012345678",
          whatsapp_number: "08012345678",
          instagram_handle: "@luxeatelier",
          business_name: "Luxe Atelier",
          sector: "Fashion",
          payment_status: "paid",
          category_accepted: true,
          image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"
        },
        {
          full_name: "Glow & Co.",
          email: "hello@glowandco.com",
          phone_number: "08023456789",
          whatsapp_number: "08023456789",
          instagram_handle: "@glowandco",
          business_name: "Glow & Co.",
          sector: "Beauty",
          payment_status: "paid",
          category_accepted: true,
          image: "https://images.unsplash.com/photo-1596462502278-27bfdd403348?q=80&w=2070&auto=format&fit=crop"
        },
        {
          full_name: "Artisan Brews",
          email: "info@artisanbrews.com",
          phone_number: "08034567890",
          whatsapp_number: "08034567890",
          instagram_handle: "@artisanbrews",
          business_name: "Artisan Brews",
          sector: "Food & Drink",
          payment_status: "paid",
          category_accepted: true,
          image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1974&auto=format&fit=crop"
        },
        {
          full_name: "Velvet Home",
          email: "sales@velvethome.com",
          phone_number: "08045678901",
          whatsapp_number: "08045678901",
          instagram_handle: "@velvethome",
          business_name: "Velvet Home",
          sector: "Home Decor",
          payment_status: "paid",
          category_accepted: true,
          image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?q=80&w=2070&auto=format&fit=crop"
        },
        {
          full_name: "Urban Threads",
          email: "shop@urbanthreads.com",
          phone_number: "08056789012",
          whatsapp_number: "08056789012",
          instagram_handle: "@urbanthreads",
          business_name: "Urban Threads",
          sector: "Fashion",
          payment_status: "paid",
          category_accepted: true,
          image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2070&auto=format&fit=crop"
        },
        {
          full_name: "Pure Essence",
          email: "wellness@pureessence.com",
          phone_number: "08067890123",
          whatsapp_number: "08067890123",
          instagram_handle: "@pureessence",
          business_name: "Pure Essence",
          sector: "Wellness",
          payment_status: "paid",
          category_accepted: true,
          image: "https://images.unsplash.com/photo-1544367563-12123d8965cd?q=80&w=2070&auto=format&fit=crop"
        }
    ];

    for (const vendor of vendors) {
        // Simple check to avoid duplicates on multiple runs
        const check = await pool.query('SELECT * FROM vendors WHERE email = $1', [vendor.email]);
        if (check.rows.length === 0) {
            await pool.query(`
                INSERT INTO vendors (
                    full_name, email, phone_number, whatsapp_number, instagram_handle, 
                    business_name, sector, payment_status, category_accepted, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            `, [
                vendor.full_name, vendor.email, vendor.phone_number, vendor.whatsapp_number, vendor.instagram_handle,
                vendor.business_name, vendor.sector, vendor.payment_status, vendor.category_accepted
            ]);
            console.log(`Seeded vendor: ${vendor.business_name}`);
        }
    }

    // 3. Seed Events
    const events = [
        {
            title: "Basal Stage",
            location: "Main Hall, Abuja",
            start_date: "2026-06-15 10:00:00",
            description: "The opening ceremony featuring top designers.",
            image_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop",
            status: "upcoming",
            is_featured: true
        },
        {
            title: "Apparel Flash",
            location: "Fashion Tent",
            start_date: "2026-06-16 14:00:00",
            description: "A showcase of the latest trends in street wear.",
            image_url: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1974&auto=format&fit=crop",
            status: "upcoming",
            is_featured: false
        }
    ];

    for (const event of events) {
         const check = await pool.query('SELECT * FROM events WHERE title = $1', [event.title]);
         if (check.rows.length === 0) {
             await pool.query(`
                INSERT INTO events (title, location, start_date, description, image_url, status, is_featured)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
             `, [event.title, event.location, event.start_date, event.description, event.image_url, event.status, event.is_featured]);
             console.log(`Seeded event: ${event.title}`);
         }
    }

    // 4. Seed Blog Posts
    const blogs = [
        {
            title: "The Future of Luxury Fashion",
            slug: "future-of-luxury-fashion",
            excerpt: "Exploring how sustainable materials are redefining the luxury landscape.",
            content: "Full article content here...",
            category: "Fashion",
            image_url: "/images/seed/blog-luxury.jpg",
            is_published: true
        },
        {
            title: "Top 5 Trends for 2026",
            slug: "top-5-trends-2026",
            excerpt: "A look ahead at what will dominate the runways next season.",
            content: "Full article content here...",
            category: "Trends",
            image_url: "/images/seed/blog-trends.jpg",
            is_published: true
        }
    ];

    for (const blog of blogs) {
        const check = await pool.query('SELECT * FROM blogs WHERE slug = $1', [blog.slug]);
        if (check.rows.length === 0) {
            await pool.query(`
                INSERT INTO blogs (title, slug, excerpt, content, category, image_url, is_published, published_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            `, [blog.title, blog.slug, blog.excerpt, blog.content, blog.category, blog.image_url, blog.is_published]);
            console.log(`Seeded blog: ${blog.title}`);
        }
    }

    console.log('Seeding completed successfully.');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    pool.end();
  }
};

seed();