import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/infra/db/prisma-client';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } = parsedCredentials.data;
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, user.passwordHash);

        if (passwordsMatch) {
          const cleanImage = user.image && (user.image.startsWith('data:') || user.image.length > 150) ? 'DB_IMAGE' : user.image;
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: cleanImage,
            phone: user.phone,
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'CLIENT';
        token.phone = user.phone;
        const img = user.image || null;
        if (img && (img.startsWith('data:') || img.length > 150 || img === 'BASE64_IN_DB' || img === 'DB_IMAGE')) {
          token.image = 'DB_IMAGE';
        } else {
          token.image = img;
        }
      }
      if (trigger === 'update' && session) {
        if (session.name !== undefined) token.name = session.name;
        if (session.email !== undefined) token.email = session.email;
        if (session.phone !== undefined) token.phone = session.phone;
        if (session.image !== undefined) {
          const img = session.image;
          if (img && (typeof img === 'string') && (img.startsWith('data:') || img.length > 150 || img === 'BASE64_IN_DB' || img === 'DB_IMAGE')) {
            token.image = 'DB_IMAGE';
          } else {
            token.image = session.image;
          }
        }
      }
      // Remove any large properties automatically attached by Google/OAuth providers or adapter
      delete (token as any).picture;
      delete (token as any).sub;
      delete (token as any).passwordHash;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.phone = token.phone as string | null;
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;

        if ((token.image === 'BASE64_IN_DB' || token.image === 'DB_IMAGE') && token.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { image: true },
          });
          session.user.image = dbUser?.image || null;
        } else {
          session.user.image = (token.image as string) || null;
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      const isProd = process.env.NODE_ENV === 'production';
      let cleanBaseUrl = baseUrl;
      if (isProd && cleanBaseUrl.includes('localhost')) {
        try {
          const { headers } = await import('next/headers');
          const headerList = await headers();
          const host = headerList.get('x-forwarded-host') || headerList.get('host');
          if (host && !host.includes('localhost')) {
            const proto = headerList.get('x-forwarded-proto') || 'https';
            cleanBaseUrl = `${proto}://${host}`;
          } else {
            const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
            if (vercelDomain) {
              cleanBaseUrl = `https://${vercelDomain}`;
            }
          }
        } catch (e) {
          const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
          if (vercelDomain) {
            cleanBaseUrl = `https://${vercelDomain}`;
          }
        }
      }

      if (url.startsWith('/')) {
        return `${cleanBaseUrl}${url}`;
      }
      try {
        const urlObj = new URL(url);
        if (urlObj.origin === cleanBaseUrl || (isProd && !urlObj.hostname.includes('localhost'))) {
          return url;
        }
      } catch (e) {
        // Ignore parsing errors
      }
      return cleanBaseUrl;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  trustHost: true,
});
