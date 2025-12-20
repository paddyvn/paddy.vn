import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopifyBlog {
  id: number;
  title: string;
}

interface ShopifyArticle {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  summary_html: string;
  author: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  tags: string;
  blog_id: number;
  image?: {
    src: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Shopify blog posts sync...');

    const shopifyDomain = Deno.env.get('SHOPIFY_STORE_DOMAIN');
    const shopifyToken = Deno.env.get('SHOPIFY_ADMIN_API_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    if (!shopifyDomain || !shopifyToken || !supabaseAnonKey) {
      throw new Error('Missing required credentials');
    }

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has admin role using service role client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('Admin check failed:', roleError?.message || 'No admin role found');
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin authenticated:', user.id);

    // First, fetch all blogs
    console.log('Fetching blogs from Shopify...');
    const blogsResponse = await fetch(
      `https://${shopifyDomain}/admin/api/2024-01/blogs.json`,
      {
        headers: {
          'X-Shopify-Access-Token': shopifyToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!blogsResponse.ok) {
      const errorText = await blogsResponse.text();
      console.error('Shopify blogs API error:', errorText);
      throw new Error(`Shopify blogs API error: ${blogsResponse.status} ${errorText}`);
    }

    const blogsData = await blogsResponse.json();
    const blogs: ShopifyBlog[] = blogsData.blogs || [];
    console.log(`Found ${blogs.length} blogs`);

    // Create a map of blog IDs to titles
    const blogMap = new Map<number, string>();
    blogs.forEach((blog) => blogMap.set(blog.id, blog.title));

    // Fetch all articles from all blogs
    let allArticles: ShopifyArticle[] = [];
    
    for (const blog of blogs) {
      console.log(`Fetching articles from blog: ${blog.title}`);
      let hasNextPage = true;
      let pageInfo: string | null = null;

      while (hasNextPage) {
        const url: string = pageInfo
          ? `https://${shopifyDomain}/admin/api/2024-01/blogs/${blog.id}/articles.json?limit=250&page_info=${pageInfo}`
          : `https://${shopifyDomain}/admin/api/2024-01/blogs/${blog.id}/articles.json?limit=250`;

        const response: Response = await fetch(url, {
          headers: {
            'X-Shopify-Access-Token': shopifyToken,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Shopify articles API error:', errorText);
          throw new Error(`Shopify articles API error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        const articles = data.articles || [];
        allArticles = allArticles.concat(articles);

        console.log(`Fetched ${articles.length} articles from ${blog.title}. Total so far: ${allArticles.length}`);

        // Check for pagination
        const linkHeader: string | null = response.headers.get('Link');
        if (linkHeader && linkHeader.includes('rel="next"')) {
          const nextMatch: RegExpMatchArray | null = linkHeader.match(/<[^>]*page_info=([^>&]+)[^>]*>;\s*rel="next"/);
          pageInfo = nextMatch ? nextMatch[1] : null;
          hasNextPage = !!pageInfo;
        } else {
          hasNextPage = false;
        }
      }
    }

    console.log(`Total articles fetched from Shopify: ${allArticles.length}`);

    // Sync articles to Supabase
    let syncedCount = 0;
    let errorCount = 0;

    for (const article of allArticles) {
      try {
        const articleData = {
          shopify_article_id: article.id.toString(),
          shopify_blog_id: article.blog_id.toString(),
          blog_title: blogMap.get(article.blog_id) || '',
          title: article.title,
          handle: article.handle,
          body_html: article.body_html || '',
          summary_html: article.summary_html || '',
          author: article.author || '',
          published: !!article.published_at,
          tags: article.tags || '',
          image_url: article.image?.src || null,
          shopify_created_at: article.created_at,
          shopify_updated_at: article.updated_at,
          shopify_published_at: article.published_at,
        };

        const { error } = await supabase
          .from('blog_posts')
          .upsert(articleData, {
            onConflict: 'shopify_article_id',
          });

        if (error) {
          console.error(`Error syncing article ${article.title}:`, error);
          errorCount++;
        } else {
          syncedCount++;
        }
      } catch (error) {
        console.error(`Exception syncing article ${article.title}:`, error);
        errorCount++;
      }
    }

    console.log(`Sync complete. Synced: ${syncedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${syncedCount} blog posts from ${blogs.length} blogs`,
        total: allArticles.length,
        synced: syncedCount,
        errors: errorCount,
        blogs: blogs.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in blog posts sync:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});