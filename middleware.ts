import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get auth cookie (set by Firebase Auth)
    // Note: This is a simplified version. In production, you'd verify the Firebase ID token
    const authCookie = request.cookies.get("firebase-auth-token");

    // Public routes that don't require authentication
    // Note: Route groups like (auth) are removed from URLs, so /login not /auth/login
    const publicRoutes = ["/login", "/register", "/forgot-password", "/"];

    // Check if the current path is a public route
    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

    // Allow access to public routes
    if (isPublicRoute) {
        return NextResponse.next();
    }

    // Protected routes - require authentication
    if (!authCookie) {
        // Not authenticated - redirect to login
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // User is authenticated - allow access
    return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - api routes (handled separately)
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico (favicon file)
         * - public files (images, etc.)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
