import { NextResponse, NextRequest } from 'next/server';
import { getSingleEvent } from './src/lib/events';

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // Skip middleware for API routes and static files
  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  
  // Only handle pages that use eventSlug parameter
  const eventSlug = searchParams.get('eventSlug');
  if (!eventSlug) {
    return NextResponse.next();
  }
  
  try {
    // Get the current event to check if the slug is correct
    const event = await getSingleEvent();
    
    if (event && event.slug !== eventSlug) {
      // The slug in the URL doesn't match the current event slug
      // Redirect to the correct slug
      const newUrl = new URL(request.url);
      newUrl.searchParams.set('eventSlug', event.slug);
      
      return NextResponse.redirect(newUrl, 307); // Temporary redirect
    }
  } catch (error) {
    console.error('Middleware error:', error);
    // Continue with the request if there's an error
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/upload/:path*', 
    '/wall/:path*',
    '/thanks/:path*'
  ]
};
